/*
  It's common to have a data interface which is used across multiple routes in an API,
  for instance a shared CSV Export system which can be applied to multiple entities in an application.

  The polymorphism types can be used to generate abstract types which clients sharing a common
  interface are compatible with, and allow you to pass around deep route paths to generic components with ease.
*/
import { testReactResource } from './__helpers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import React, { useState } from 'react';
import { describe, expect, test } from 'vitest';
import type { inferOutput } from '../src';
/**
 * We define a client factory which can be used many times.
 *
 * This also exports abstract types which concrete client instances are compatible with
 */
import * as Factory from './polymorphism.factory';

/**
 * The backend is defined here (in-memory for tests)
 */
function createApi() {
  const IssueExportsProvider: Factory.FileExportStatusType[] = [];
  const DiscussionExportsProvider: Factory.FileExportStatusType[] = [];

  const client = {
    github: {
      issues: {
        export: Factory.createExportRoute(IssueExportsProvider),
      },
      discussions: {
        export: {
          ...Factory.createExportRoute(DiscussionExportsProvider),
          someExtraProcedure: {
            post: async (opts: { name: string }) => {
              return {
                data: 'Hello ' + opts.name,
                error: null,
                response: new Response(null, { status: 200 }),
                status: 200,
                headers: {},
              };
            },
          },
        },
      },
    },
  };

  return {
    client,
    IssueExportsProvider,
    DiscussionExportsProvider,
  };
}

describe('polymorphism', () => {
  const testContext = () => {
    const { client } = createApi();
    return testReactResource(client);
  };

  describe('simple factory', () => {
    test('can use a simple factory route with an abstract interface', async () => {
      const ctx = testContext();
      const { useTreatyUtils } = ctx;

      function IssuesExportPage() {
        const utils = useTreatyUtils();
        const client = useQueryClient();
        const exportRoute =
          utils.github.issues.export as unknown as Factory.ExportRouteLike;

        const [currentExport, setCurrentExport] = useState<number | null>(null);
        const invalidate = useMutation({
          mutationFn: () => client.invalidateQueries(utils.github.pathFilter()),
        });

        return (
          <>
            <StartExportButton
              route={exportRoute}
              onExportStarted={setCurrentExport}
            />

            <RefreshExportsListButton
              mutate={invalidate.mutate}
              isPending={invalidate.isPending}
            />

            <ExportStatus
              status={exportRoute.status}
              currentExport={currentExport}
            />

            <ExportsList list={exportRoute.list} />
          </>
        );
      }

      const $ = ctx.renderApp(<IssuesExportPage />);

      await userEvent.click($.getByTestId('startExportBtn'));

      await waitFor(() => {
        expect($.container).toHaveTextContent(
          'Last Export: `Search for Polymorphism React` (Working)',
        );
      });

      await userEvent.click($.getByTestId('refreshBtn'));

      await waitFor(() => {
        expect($.container).toHaveTextContent(
          'Last Export: `Search for Polymorphism React` (Ready!)',
        );
      });
    });

    test('can use the abstract interface with a factory instance merged with extra procedures', async () => {
      const ctx = testContext();
      const { useTreatyUtils } = ctx;

      function DiscussionsExportPage() {
        const utils = useTreatyUtils();
        const client = useQueryClient();
        const exportRoute =
          utils.github.discussions.export as unknown as Factory.ExportRouteLike;

        const [currentExport, setCurrentExport] = useState<number | null>(null);

        const invalidate = useMutation({
          mutationFn: () => client.invalidateQueries(utils.github.pathFilter()),
        });

        return (
          <>
            <StartExportButton
              route={exportRoute}
              onExportStarted={setCurrentExport}
            />

            <RefreshExportsListButton
              mutate={invalidate.mutate}
              isPending={invalidate.isPending}
            />

            <ExportStatus
              status={exportRoute.status}
              currentExport={currentExport}
            />

            <ExportsList list={exportRoute.list} />
          </>
        );
      }

      const $ = ctx.renderApp(<DiscussionsExportPage />);

      await userEvent.click($.getByTestId('startExportBtn'));

      await waitFor(() => {
        expect($.container).toHaveTextContent(
          'Last Export: `Search for Polymorphism React` (Working)',
        );
      });

      await userEvent.click($.getByTestId('refreshBtn'));

      await waitFor(() => {
        expect($.container).toHaveTextContent(
          'Last Export: `Search for Polymorphism React` (Ready!)',
        );
      });
    });
  });
});

function StartExportButton(props: {
  route: Factory.ExportRouteLike;
  onExportStarted: (id: number) => void;
}) {
  const client = useQueryClient();

  const exportStarter = useMutation(
    props.route.start.mutationOptions({
      async onSuccess(data) {
        props.onExportStarted(data.id);

        await client.invalidateQueries(props.route.pathFilter());
      },
    }),
  );

  return (
    <button
      data-testid="startExportBtn"
      onClick={() => {
        exportStarter.mutate({
          filter: 'polymorphism react',
          name: 'Search for Polymorphism React',
        });
      }}
    >
      Start Export
    </button>
  );
}

function RefreshExportsListButton(props: {
  mutate: () => void;
  isPending: boolean;
}) {
  return (
    <button
      data-testid="refreshBtn"
      onClick={props.mutate}
      disabled={props.isPending}
    >
      Refresh
    </button>
  );
}

function ExportStatus<
  TStatus extends Factory.ExportRouteLike['status'],
>(props: {
  status: TStatus;
  renderAdditionalFields?: (data: inferOutput<TStatus['queryOptions']>) => ReactNode;
  currentExport: number | null;
}) {
  const exportStatus = useQuery(
    props.status.queryOptions(
      { id: props.currentExport ?? -1 },
      { enabled: props.currentExport !== null },
    ),
  );

  if (!exportStatus.data) {
    return null;
  }

  return (
    <p>
      Last Export: `{exportStatus.data?.name}` (
      {exportStatus.data.downloadUri ? 'Ready!' : 'Working'})
      {props.renderAdditionalFields?.(exportStatus.data as any)}
    </p>
  );
}

function ExportsList(props: {
  list: Factory.ExportRouteLike['list'];
}) {
  const exportsList = useQuery(props.list.queryOptions());

  return (
    <>
      <h4>Downloads:</h4>
      <ul>
        {exportsList.data
          ?.map((item) =>
            item.downloadUri ? (
              <li key={item.id}>
                <a href={item.downloadUri ?? '#'}>{item.name}</a>
              </li>
            ) : null,
          )
          .filter(Boolean)}
      </ul>
    </>
  );
}
