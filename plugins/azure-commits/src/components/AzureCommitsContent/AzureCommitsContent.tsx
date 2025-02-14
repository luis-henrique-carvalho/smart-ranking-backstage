import React from 'react';
import { useEntity, MissingAnnotationEmptyState } from '@backstage/plugin-catalog-react';
import { Typography, Grid, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import { useAzureCommitsApi } from '../../hooks/useAzureCommitsApi';
import { Entity } from '@backstage/catalog-model';

export const isAzureRepositoryAvailable = (entity: Entity) => {
    return Boolean(
        entity.metadata.annotations?.['azure.com/repository-id'] &&
        entity.metadata.annotations?.['azure.com/organization'] &&
        entity.metadata.annotations?.['azure.com/project']
    );
}

export const AzureCommitsContent = () => {
    const { entity } = useEntity();

    const repositoryId = entity.metadata.annotations?.['azure.com/repository-id'];
    const organization = entity.metadata.annotations?.['azure.com/organization'];
    const project = entity.metadata.annotations?.['azure.com/project'];

    const repositoryUrl = `https://dev.azure.com/${organization}/${project}/_apis/git/repositories/${repositoryId}/commits?api-version=7.1-preview.1`
    const { commits, loading, error } = useAzureCommitsApi(repositoryUrl);

    if (!isAzureRepositoryAvailable(entity)) {
        return <MissingAnnotationEmptyState annotation={['azure.com/repository-id', 'azure.com/organization', 'azure.com/project']} />;
    }

    if (loading) {
        return <Typography>Carregando commits...</Typography>;
    }

    if (error) {
        return <Typography color="error">Erro ao carregar commits: {error.message}</Typography>;
    }

    return (
        <Grid container spacing={3} direction="column">
            <Grid item>
                <InfoCard title="Azure Commits">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Autor</TableCell>
                                <TableCell>Mensagem</TableCell>
                                <TableCell>Data</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {commits.map((commit: any) => (
                                <TableRow key={commit.commitId}>
                                    <TableCell>{commit.author?.name}</TableCell>
                                    <TableCell>{commit.comment}</TableCell>
                                    <TableCell>{new Date(commit.committer?.date).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </InfoCard>
            </Grid>
        </Grid>
    );
};
