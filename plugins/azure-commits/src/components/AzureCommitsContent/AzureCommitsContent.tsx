import React, { useState } from 'react';
import {
    Typography, Grid, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Paper,
    Link, Box, TableContainer, FormControl, Select, MenuItem, InputLabel
} from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { useAzureCommitsApi } from '../../hooks/useAzureCommitsApi';
import { useEntity, MissingAnnotationEmptyState } from '@backstage/plugin-catalog-react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    root: { padding: theme.spacing(2) },
    tableHeader: { backgroundColor: theme.palette.background.paper, fontWeight: 'bold' },
    tableRow: { '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } },
    selectContainer: { marginBottom: theme.spacing(2), minWidth: 200 },
    changesContainer: { display: 'flex', justifyContent: 'space-between' },
    box: { display: 'flex', gap: theme.spacing(0.5) },
    link: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        textDecoration: 'none',
        padding: theme.spacing(1),
        fontWeight: 'bold',
        color: theme.palette.primary.main,
        borderRadius: theme.shape.borderRadius,
        transition: 'background-color 0.3s, color 0.3s',
        '&:hover': { backgroundColor: theme.palette.primary.main, color: theme.palette.common.white },
    },
}));

export const AzureCommitsContent = () => {
    const { entity } = useEntity();
    const classes = useStyles();

    const repositoryId = entity.metadata.annotations?.['azure.com/repository-id'];
    const organization = entity.metadata.annotations?.['azure.com/organization'];
    const project = entity.metadata.annotations?.['azure.com/project'];

    const { commits, branchLIst, selectedBranch, setSelectedBranch, loading, error } = useAzureCommitsApi(repositoryId!, organization!, project!);

    if (!repositoryId || !organization || !project) {
        return <MissingAnnotationEmptyState annotation={['azure.com/repository-id', 'azure.com/organization', 'azure.com/project']} />;
    }

    const handleBranchChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setSelectedBranch(event.target.value as string);
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
                <InfoCard title={`Azure Commits - Branch: ${selectedBranch}`} noPadding>
                    {/* Select para escolher a branch */}
                    <Box className={classes.selectContainer}>
                        <FormControl variant="outlined" size="medium" style={{ width: '200px' }}>
                            <InputLabel>Selecionar Branch</InputLabel>
                            <Select value={selectedBranch} onChange={handleBranchChange} label="Selecionar Branch">
                                {branchLIst.map((branch) => (
                                    <MenuItem key={branch.objectId} value={branch.name}>{branch.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <TableContainer component={Paper}>
                        <Table aria-label="Tabela de Commits">
                            <TableHead>
                                <TableRow>
                                    <TableCell className={classes.tableHeader}>Autor</TableCell>
                                    <TableCell className={classes.tableHeader}>Mensagem</TableCell>
                                    <TableCell className={classes.tableHeader}>Data</TableCell>
                                    <TableCell className={classes.tableHeader}>Alterações</TableCell>
                                    <TableCell className={classes.tableHeader}>Ações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {commits.map((commit: any) => (
                                    <TableRow key={commit.commitId} className={classes.tableRow}>
                                        <TableCell>
                                            <Typography variant="subtitle1">{commit.author?.name}</Typography>
                                            <Typography variant="body2" color="textSecondary">{commit.author?.email}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body1">{commit.comment}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body1">
                                                {new Date(commit.committer?.date).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <div className={classes.changesContainer}>
                                                <Box display="flex" alignItems="center" className={classes.box}>
                                                    <AddCircleIcon fontSize="small" color="primary" />
                                                    <Typography variant="body2" color="primary">
                                                        {commit.changeCounts.Add}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" alignItems="center" className={classes.box}>
                                                    <EditIcon fontSize="small" color="secondary" />
                                                    <Typography variant="body2" color="secondary">
                                                        {commit.changeCounts.Edit}
                                                    </Typography>
                                                </Box>
                                                <Box display="flex" alignItems="center" className={classes.box}>
                                                    <DeleteIcon fontSize="small" color="error" />
                                                    <Typography variant="body2" color="error">
                                                        {commit.changeCounts.Delete}
                                                    </Typography>
                                                </Box>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={commit.remoteUrl} className={classes.link} target="_blank" rel="noreferrer">
                                                <OpenInNewIcon fontSize="small" />
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </InfoCard>
            </Grid>
        </Grid>
    );
};
