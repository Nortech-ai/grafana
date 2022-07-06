import React, { useEffect, useState } from 'react';
import { useLocalStorage } from 'react-use';

import { isLiveChannelMessageEvent, isLiveChannelStatusEvent, LiveChannelScope } from '@grafana/data';
import { getBackendSrv, getGrafanaLiveSrv } from '@grafana/runtime';
import { Button, CodeEditor, HorizontalGroup, LinkButton } from '@grafana/ui';

import { StorageView } from './types';

export const EXPORT_LOCAL_STORAGE_KEY = 'grafana.export.config';

interface ExportStatusMessage {
  running: boolean;
  target: string;
  started: number;
  finished: number;
  update: number;
  count: number;
  current: number;
  last: string;
  status: string;
}

interface ExportJob {
  format: 'git';
  generalFolderPath: string;
  includeHistory: boolean;
  excludeDashboards: boolean;

  git?: {};
}

const defaultJob: ExportJob = {
  format: 'git',
  generalFolderPath: 'general',
  includeHistory: true,
  excludeDashboards: false,
  git: {},
};

interface Props {
  onPathChange: (p: string, v?: StorageView) => void;
}

export const ExportView = ({ onPathChange }: Props) => {
  const [status, setStatus] = useState<ExportStatusMessage>();
  const [rawBody, setBody] = useLocalStorage<ExportJob>(EXPORT_LOCAL_STORAGE_KEY, defaultJob);
  const body = { ...defaultJob, ...rawBody };

  const doStart = () => {
    getBackendSrv().post('/api/admin/export', body);
  };
  const doStop = () => {
    getBackendSrv().post('/api/admin/export/stop');
  };

  useEffect(() => {
    const subscription = getGrafanaLiveSrv()
      .getStream<ExportStatusMessage>({
        scope: LiveChannelScope.Grafana,
        namespace: 'broadcast',
        path: 'export',
      })
      .subscribe({
        next: (evt) => {
          if (isLiveChannelMessageEvent(evt)) {
            setStatus(evt.message);
          } else if (isLiveChannelStatusEvent(evt)) {
            setStatus(evt.message);
          }
        },
      });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {status && (
        <div>
          <h3>Status</h3>
          <pre>{JSON.stringify(status, null, 2)}</pre>
          {status.running && (
            <div>
              <Button variant="secondary" onClick={doStop}>
                Stop
              </Button>
            </div>
          )}
        </div>
      )}

      {!Boolean(status?.running) && (
        <div>
          <h3>Export grafana instance</h3>
          <CodeEditor
            height={200}
            value={JSON.stringify(body, null, 2) ?? ''}
            showLineNumbers={false}
            readOnly={false}
            language="json"
            showMiniMap={false}
            onBlur={(text: string) => {
              setBody(JSON.parse(text)); // force JSON?
            }}
          />
          <br />

          <HorizontalGroup>
            <Button onClick={doStart} variant="primary">
              Export
            </Button>
            <LinkButton href="admin/storage/" variant="secondary">
              Cancel
            </LinkButton>
          </HorizontalGroup>
        </div>
      )}
    </div>
  );
};
