import React from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Typography, Link, Box } from '@material-ui/core';
import { Commit } from '../../../types';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { useStyles } from '../style';

interface CommitsTableProps {
    commits: Commit[];
}

export const CommitsTable = ({ commits }: CommitsTableProps) => {
    const classes = useStyles();

    return (
        <Table aria-label="Tabela de Commits">
            <TableHead>
                <TableRow>
                    <TableCell>Autor</TableCell>
                    <TableCell>Mensagem</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Alterações</TableCell>
                    <TableCell>Ações</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {commits.map((commit) => (
                    <TableRow key={commit.commitId}>
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
                        </TableCell>
                        <TableCell>
                            <Link href={commit.remoteUrl} target="_blank" rel="noreferrer">
                                <OpenInNewIcon fontSize="small" />
                            </Link>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
