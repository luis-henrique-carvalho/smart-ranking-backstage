import React from 'react';
import { Typography } from '@material-ui/core';
import { Table, TableColumn } from "@backstage/core-components";

interface ResourceTableProps {
    combinedData: { resourceName: string; resourceType: 'queue' | 'topic' }[];
    renderActionButton: (row: { resourceName: string; resourceType: string }) => React.ReactNode;
}

export const ResourceTable: React.FC<ResourceTableProps> = ({ combinedData, renderActionButton }) => {

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
            title="Filas e Tópicos"
        />
    );
};
