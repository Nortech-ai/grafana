package clients

import (
	"context"
	"encoding/hex"
	"fmt"
	"hash/fnv"
	"net"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/grafana/grafana/pkg/infra/log"
	authidentity "github.com/grafana/grafana/pkg/services/auth/identity"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/login"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
	"github.com/grafana/grafana/pkg/util/errutil"
)

const (
	proxyFieldName   = "Name"
	proxyFieldEmail  = "Email"
	proxyFieldLogin  = "Login"
	proxyFieldRole   = "Role"
	proxyFieldGroups = "Groups"
	proxyCachePrefix = "authn-proxy-sync-ttl"
)

var proxyFields = [...]string{proxyFieldName, proxyFieldEmail, proxyFieldLogin, proxyFieldRole, proxyFieldGroups}

var (
	errNotAcceptedIP      = errutil.Unauthorized("auth-proxy.invalid-ip")
	errEmptyProxyHeader   = errutil.Unauthorized("auth-proxy.empty-header")
	errInvalidProxyHeader = errutil.Internal("auth-proxy.invalid-proxy-header")
)

var (
	_ authn.HookClient         = new(Proxy)
	_ authn.ContextAwareClient = new(Proxy)
)

func ProvideProxy(cfg *setting.Cfg, cache proxyCache, userSrv user.Service, clients ...authn.ProxyClient) (*Proxy, error) {
	list, err := parseAcceptList(cfg.AuthProxyWhitelist)
	if err != nil {
		return nil, err
	}
	return &Proxy{log.New(authn.ClientProxy), cfg, cache, userSrv, clients, list}, nil
}

type proxyCache interface {
	Get(ctx context.Context, key string) ([]byte, error)
	Set(ctx context.Context, key string, value []byte, expire time.Duration) error
}

type Proxy struct {
	log         log.Logger
	cfg         *setting.Cfg
	cache       proxyCache
	userSrv     user.Service
	clients     []authn.ProxyClient
	acceptedIPs []*net.IPNet
}

func (c *Proxy) Name() string {
	return authn.ClientProxy
}

func (c *Proxy) Authenticate(ctx context.Context, r *authn.Request) (*authn.Identity, error) {
	if !c.isAllowedIP(r) {
		return nil, errNotAcceptedIP.Errorf("request ip is not in the configured accept list")
	}

	username := getProxyHeader(r, c.cfg.AuthProxyHeaderName, c.cfg.AuthProxyHeadersEncoded)
	if len(username) == 0 {
		return nil, errEmptyProxyHeader.Errorf("no username provided in auth proxy header")
	}

	additional := getAdditionalProxyHeaders(r, c.cfg)

	var clientErr error
	for _, proxyClient := range c.clients {
		var identity *authn.Identity
		identity, clientErr = proxyClient.AuthenticateProxy(ctx, r, username, additional)
		if identity != nil {
			identity.AuthenticatedBy = login.AuthProxyAuthModule
			return identity, nil
		}
	}

	return nil, clientErr
}

func (c *Proxy) Test(ctx context.Context, r *authn.Request) bool {
	return len(getProxyHeader(r, c.cfg.AuthProxyHeaderName, c.cfg.AuthProxyHeadersEncoded)) != 0
}

func (c *Proxy) Priority() uint {
	return 50
}

func (c *Proxy) Hook(ctx context.Context, identity *authn.Identity, r *authn.Request) error {
	if identity.ClientParams.CacheAuthProxyKey == "" {
		return nil
	}

	namespace, identifier := identity.GetNamespacedID()
	if namespace != authn.NamespaceUser {
		return nil
	}

	id, err := authidentity.IntIdentifier(namespace, identifier)
	if err != nil {
		c.log.Warn("Failed to cache proxy user", "error", err, "userId", identifier, "err", err)
		return nil
	}
	c.log.FromContext(ctx).Debug("Cache proxy user", "userId", id)
	bytes := []byte(strconv.FormatInt(id, 10))
	if err := c.cache.Set(ctx, identity.ClientParams.CacheAuthProxyKey, bytes, time.Duration(c.cfg.AuthProxySyncTTL)*time.Minute); err != nil {
		c.log.Warn("Failed to cache proxy user", "error", err, "userId", id)
	}

	return nil
}

func (c *Proxy) isAllowedIP(r *authn.Request) bool {
	if len(c.acceptedIPs) == 0 {
		return true
	}

	host, _, err := net.SplitHostPort(r.HTTPRequest.RemoteAddr)
	if err != nil {
		return false
	}

	ip := net.ParseIP(host)
	for _, v := range c.acceptedIPs {
		if v.Contains(ip) {
			return true
		}
	}

	return false
}

func parseAcceptList(s string) ([]*net.IPNet, error) {
	if len(strings.TrimSpace(s)) == 0 {
		return nil, nil
	}
	addresses := strings.Split(s, ",")
	list := make([]*net.IPNet, 0, len(addresses))
	for _, addr := range addresses {
		result, err := coerceProxyAddress(addr)
		if err != nil {
			return nil, err
		}
		list = append(list, result)
	}
	return list, nil
}

// coerceProxyAddress gets network of the presented CIDR notation
func coerceProxyAddress(proxyAddr string) (*net.IPNet, error) {
	proxyAddr = strings.TrimSpace(proxyAddr)
	if !strings.Contains(proxyAddr, "/") {
		proxyAddr = path.Join(proxyAddr, "32")
	}

	_, network, err := net.ParseCIDR(proxyAddr)
	if err != nil {
		return nil, fmt.Errorf("could not parse the network: %w", err)
	}
	return network, nil
}

func getProxyHeader(r *authn.Request, headerName string, encoded bool) string {
	if r.HTTPRequest == nil {
		return ""
	}
	v := r.HTTPRequest.Header.Get(headerName)
	if encoded {
		v = util.DecodeQuotedPrintable(v)
	}
	return v
}

func getAdditionalProxyHeaders(r *authn.Request, cfg *setting.Cfg) map[string]string {
	additional := make(map[string]string, len(proxyFields))
	for _, k := range proxyFields {
		if v := getProxyHeader(r, cfg.AuthProxyHeaders[k], cfg.AuthProxyHeadersEncoded); v != "" {
			additional[k] = v
		}
	}
	return additional
}

func getProxyCacheKey(username string, additional map[string]string) (string, bool) {
	key := strings.Builder{}
	key.WriteString(username)
	for _, k := range proxyFields {
		if v, ok := additional[k]; ok {
			key.WriteString(v)
		}
	}

	hash := fnv.New128a()
	if _, err := hash.Write([]byte(key.String())); err != nil {
		return "", false
	}

	return strings.Join([]string{proxyCachePrefix, hex.EncodeToString(hash.Sum(nil))}, ":"), true
}
