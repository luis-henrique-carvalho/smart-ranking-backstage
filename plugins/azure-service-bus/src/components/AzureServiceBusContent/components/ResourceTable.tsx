import React from 'react';
import { Grid, Typography } from '@material-ui/core';
import { Table, TableColumn } from "@backstage/core-components";
import { BuildItemType } from '../../../types';

interface ResourceTableProps {
    buildManagerState: Record<string, BuildItemType>;
    combinedData: { resourceName: string; resourceType: 'queue' | 'topic' }[];
    renderActionButton: (row: { resourceName: string; resourceType: string }) => React.ReactNode;
}

export const ResourceTable: React.FC<ResourceTableProps> = ({ combinedData, renderActionButton, buildManagerState }) => {
    const totalInQueue = Object.values(buildManagerState).filter((q) => q.status !== 'completed').length;

    const columns: TableColumn<{ resourceName: string; resourceType: string }>[] = [{
        title: 'Resource Name',
        field: 'resourceName',
        render: (row) => (
            <Typography variant="body2">{row.resourceName}</Typography>
        )
    }, {
        title: 'Resource Type',
        field: 'resourceType',
        render: (row) => (
            <Typography variant="body2">{row.resourceType}</Typography>
        )
    }, {
        title: 'Action',
        render: renderActionButton
    }];

    return (
        <Table
            options={{
                paging: true
            }}
            data={combinedData}
            columns={columns}
            title={
                <Grid container spacing={1} justifyContent="space-between" alignItems="stretch" style={{ width: '100%' }}>
                    <Grid item>
                        <Typography variant="h6">Queues and Topics</Typography>
                    </Grid>
                    <Grid item>
                        <Typography variant="body1">Total in queue: {totalInQueue}</Typography>
                    </Grid>
                </Grid>
            }
        />
    );
};
