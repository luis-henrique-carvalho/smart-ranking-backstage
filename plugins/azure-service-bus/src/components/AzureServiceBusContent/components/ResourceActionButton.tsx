import React from 'react';
import { Button, CircularProgress, Grid, Typography } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import { BuildItemType } from '../../../types';

interface ResourceActionButtonProps {
    resource: {
        resourceName: string;
        resourceType: string;
    };
    buildMenagerState: Record<string, BuildItemType>;
    loading: boolean;
    onOpenModal: (resource: { resourceName: string; resourceType: string }) => void;
    onChangeCurrentBuildView: (resourceName: string) => void;
    onCancelBuild: (resourceName: string) => void;
}

export const ResourceActionButton = ({
    resource,
    buildMenagerState,
    loading,
    onOpenModal,
    onChangeCurrentBuildView,
    onCancelBuild,
}: ResourceActionButtonProps) => {
    const theme = useTheme();
    const currentResource = buildMenagerState[resource.resourceName];
    const totalInQueue = Object.values(buildMenagerState).filter(
        (q) => q.status !== 'completed'
    ).length;

    if (currentResource) {
        return (
            <Grid container spacing={1} alignItems="center" style={{ minWidth: '50%' }}>
                <Grid item style={{ display: 'flex', alignItems: 'center' }}>
                    {currentResource.status === 'completed' ? (
                        <>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => onOpenModal(resource)}
                                style={{ marginRight: '8px' }}
                            >
                                Executar
                            </Button>
                            <Button
                                variant="outlined"
                                color="default"
                                onClick={() => {
                                    onChangeCurrentBuildView(resource.resourceName);
                                }}
                            >
                                Ver Logs
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="contained"
                                color={currentResource.status === 'running' ? 'default' : 'primary'}
                                onClick={() => onChangeCurrentBuildView(resource.resourceName)}
                                startIcon={
                                    currentResource.status === 'running' ? (
                                        <CircularProgress
                                            size={20}
                                            style={{ color: theme.palette.text.secondary }}
                                        />
                                    ) : undefined
                                }
                                style={{ marginRight: '8px' }}
                            >
                                {currentResource.status === 'running' ? 'Executando' : 'Aguardando'}
                            </Button>
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={() => onCancelBuild(resource.resourceName)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                        </>
                    )}
                </Grid>
                {currentResource.status !== 'completed' && (
                    <Typography variant="caption" display="block">
                        Quantidade em fila: {totalInQueue}
                    </Typography>
                )}
            </Grid>
        );
    }

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={() => onOpenModal(resource)}
            disabled={loading}
        >
            Executar
        </Button>
    );
};
