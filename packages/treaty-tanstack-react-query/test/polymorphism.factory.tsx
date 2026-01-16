//
// This file contains a useful pattern for treaty-tanstack-react-query:
// building factories which can produce common functionality over a homologous data source.
//

import type { Treaty } from '@elysiajs/eden/treaty2';
import type { TreatyOptionsProxy, TreatyUtilsProxy } from '../src';
import { ok } from './__helpers';

//
// DTOs
//

export type FileExportRequest = {
  name: string;
  filter: string;
};

export type FileExportStatusType = {
  id: number;
  name: string;
  downloadUri?: string;
  createdAt: Date;
};

//
// Dependencies
//

export type DataProvider = FileExportStatusType[];

//
// Set up a route factory which can be re-used for different data sources.
// In this case just with a simple array data source a POC
//

let COUNTER = 1;

export function createExportRoute(dataProvider: DataProvider) {
  return {
    start: {
      post: async (body: FileExportRequest) => {
        const exportInstance: FileExportStatusType = {
          id: COUNTER++,
          name: body.name,
          createdAt: new Date(),
          downloadUri: undefined,
        };

        dataProvider.push(exportInstance);

        return ok(exportInstance) as Treaty.TreatyResponse<{
          200: FileExportStatusType;
        }>;
      },
    },
    list: {
      get: async () =>
        ok(dataProvider) as Treaty.TreatyResponse<{ 200: FileExportStatusType[] }>,
    },
    status: {
      get: async (opts: { id: number }) => {
        const index = dataProvider.findIndex((item) => item.id === opts.id);
        const exportInstance = dataProvider[index];

        if (!exportInstance) {
          // In real usage, return an error-shaped TreatyResponse here.
          // Tests only cover the happy path.
          throw new Error('NOT_FOUND');
        }

        // When status is polled a second time the download should be ready.
        if (!exportInstance.downloadUri) {
          dataProvider[index] = {
            ...exportInstance,
            downloadUri: `example.com/export-${exportInstance.name}.csv`,
          };
          return ok(exportInstance) as Treaty.TreatyResponse<{
            200: FileExportStatusType;
          }>;
        }

        return ok(exportInstance) as Treaty.TreatyResponse<{
          200: FileExportStatusType;
        }>;
      },
    },
  };
}

type ExportRouteClient = ReturnType<typeof createExportRoute>;

export type ExportRouteLike = TreatyOptionsProxy<ExportRouteClient> &
  TreatyUtilsProxy<ExportRouteClient>;
