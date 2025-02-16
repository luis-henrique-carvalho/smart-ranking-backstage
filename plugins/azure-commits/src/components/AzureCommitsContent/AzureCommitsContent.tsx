import React, { useState } from 'react';
import { Grid, Paper, CircularProgress, Typography, TableContainer, Box } from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import { useEntity, MissingAnnotationEmptyState } from '@backstage/plugin-catalog-react';
import { useCommitsApi } from '../../hooks/useCommitsApi';
import { BranchSelect } from './components/BranchSelect';
import { CommitsTable } from './components/CommitsTable';
import { useStyles } from './style';
import { useBranchesApi } from '../../hooks/useBranchesApi';

export const AzureCommitsContent = () => {
    const { entity } = useEntity();
    const classes = useStyles();

    const repositoryId = entity.metadata.annotations?.['azure.com/repository-id'];
    const organization = entity.metadata.annotations?.['azure.com/organization'];
    const project = entity.metadata.annotations?.['azure.com/project'];

    const [selectedBranch, setSelectedBranch] = useState<string>('master');

    const { branches, loading: branchesLoading, error: branchesError } = useBranchesApi(
        repositoryId!,
        organization!,
        project!,
    );

    const { commits, loading: commitsLoading, error: commitsError } = useCommitsApi(
        repositoryId!,
        organization!,
        project!,
        selectedBranch,
    );


    if (!repositoryId || !organization || !project) {
        return <MissingAnnotationEmptyState annotation={['azure.com/repository-id', 'azure.com/organization', 'azure.com/project']} />;
    }

    if (branchesLoading || commitsLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
                <Typography variant="body1" style={{ marginLeft: '16px' }}>Carregando...</Typography>
            </Box>
        );
    }

    if (branchesError || commitsError) {
        return (
            <Paper className={classes.root}>
                <Typography variant="h6" color="error">Ocorreu um erro:</Typography>
                <Typography variant="body1" color="error">
                    {branchesError?.message || commitsError?.message}
                </Typography>
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
