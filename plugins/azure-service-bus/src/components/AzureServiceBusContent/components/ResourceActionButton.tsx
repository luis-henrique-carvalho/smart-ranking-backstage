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
}

export const ResourceActionButton = ({
    resource,
    buildMenagerState,
    loading,
    onOpenModal,
    onChangeCurrentBuildView,
}: ResourceActionButtonProps) => {
    const theme = useTheme();
    const currentResource = buildMenagerState[resource.resourceName];
    const totalInQueue = Object.values(buildMenagerState).filter(
        (q) => q.status !== 'completed'
    ).length;

    if (currentResource) {
        return (
            <Grid container spacing={1} alignItems="center">
                <Grid item>
                    {currentResource.status === 'completed' ? (
                        <>
                            <Button
                                variant="outlined"
                                color="default"
                                onClick={() => {
                                    onChangeCurrentBuildView(resource.resourceName);
                                }}
                            >
                                Ver Logs
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => onOpenModal(resource)}
                                style={{ marginLeft: '8px' }}
                            >
                                Executar
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="contained"
                            color={currentResource.status === 'running' ? 'default' : 'primary'}
                            onClick={() => {
                                onChangeCurrentBuildView(resource.resourceName);
                            }}
                        >
                            {currentResource.status === 'running' && (
                                <>
                                    <CircularProgress
                                        size={20}
                                        style={{ marginRight: '8px', color: theme.palette.text.secondary }}
                                    />
                                    Em execução
                                </>
                            )}
                            {currentResource.status === 'queued' && 'Aguardando'}
                        </Button>
                    )}
                    {currentResource.status !== 'completed' && (
                        <Typography variant="caption" display="block">
                            Quantidade em fila: {totalInQueue}
                        </Typography>
                    )}
                </Grid>
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
