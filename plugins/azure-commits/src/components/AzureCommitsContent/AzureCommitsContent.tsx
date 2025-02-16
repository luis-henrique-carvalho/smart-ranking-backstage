import React from 'react';
import { Grid, Paper, CircularProgress, Typography, TableContainer, Box } from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import { useEntity, MissingAnnotationEmptyState } from '@backstage/plugin-catalog-react';
import { useAzureCommitsApi } from '../../hooks/useAzureCommitsApi';
import { BranchSelect } from './components/BranchSelect';
import { CommitsTable } from './components/CommitsTable';
import { useStyles } from './style';

export const AzureCommitsContent = () => {
    const { entity } = useEntity();
    const classes = useStyles();

    const repositoryId = entity.metadata.annotations?.['azure.com/repository-id'];
    const organization = entity.metadata.annotations?.['azure.com/organization'];
    const project = entity.metadata.annotations?.['azure.com/project'];

    const { commits, branches, selectedBranch, setSelectedBranch, loading, error } = useAzureCommitsApi(
        repositoryId!,
        organization!,
        project!,
    );


    if (!repositoryId || !organization || !project) {
        return <MissingAnnotationEmptyState annotation={['azure.com/repository-id', 'azure.com/organization', 'azure.com/project']} />;
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
                <Typography variant="body1" style={{ marginLeft: '16px' }}>Carregando commits...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Paper className={classes.root}>
                <Typography variant="h6" color="error">Ocorreu um erro ao carregar os commits:</Typography>
                <Typography variant="body1" color="error">{error.message}</Typography>
            </Paper>
        );
    }

    return (
        <Grid container spacing={3} direction="column" className={classes.root}>
            <Grid item>
                <BranchSelect
                    branches={branches}
                    selectedBranch={selectedBranch}
                    onBranchChange={setSelectedBranch}
                />
                <InfoCard title={`Azure Commits - Branch: ${selectedBranch}`} noPadding>
                    <TableContainer component={Paper}>
                        <CommitsTable commits={commits} />
                    </TableContainer>
                </InfoCard>
            </Grid>
        </Grid>
    );
};
