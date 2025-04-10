import React from 'react';
import { Button, CircularProgress, Grid, Typography, Box } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import { BuildItemType } from '../../../types';

interface Resource {
    resourceName: string;
    resourceType: string;
}

interface ResourceActionButtonProps {
    resource: Resource;
    buildManagerState: Record<string, BuildItemType>;
    loading: boolean;
    onOpenModal: (resource: Resource) => void;
    onChangeCurrentBuildView: (resourceName: string) => void;
    onCancelBuild: (resourceName: string) => void;
}

export const ResourceActionButton: React.FC<ResourceActionButtonProps> = ({
    resource,
    buildManagerState,
    loading,
    onOpenModal,
    onChangeCurrentBuildView,
    onCancelBuild,
}) => {
    const currentResource = buildManagerState[resource.resourceName];
    const totalInQueue = Object.values(buildManagerState).filter((q) => q.status !== 'completed').length;

    if (!currentResource) {
        return (
            <Grid container spacing={1}>
                <Grid item xs={6}>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => onOpenModal(resource)}
                        disabled={loading}
                        style={{ minWidth: '100%' }}
                    >
                        Execute
                    </Button>
                </Grid>
            </Grid>
        );
    }

    return (
        <Box style={{ minWidth: '50%' }}>
            {currentResource.status === 'completed' ? (
                <Grid container spacing={1}>
                    <Grid item xs={6}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => onOpenModal(resource)}
                            disabled={loading}
                            style={{ width: '100%' }}
                        >
                            Run
                        </Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Button
                            variant="outlined"
                            color="default"
                            onClick={() => onChangeCurrentBuildView(resource.resourceName)}
                            style={{ width: '100%' }}
                        >
                            Show Logs
                        </Button>
                    </Grid>
                </Grid>
            ) : (
                <Grid container spacing={1}>
                    <Grid item xs={6}>
                        <Button
                            variant="contained"
                            color={currentResource.status === 'running' ? 'default' : 'primary'}
                            onClick={() => onChangeCurrentBuildView(resource.resourceName)}
                            startIcon={
                                currentResource.status === 'running' && (
                                    <CircularProgress size={20} style={{ color: 'black' }} />
                                )
                            }
                            style={{ width: '100%' }}
                        >
                            {currentResource.status === 'running' ? 'Running' : 'not Started'}
                        </Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => onCancelBuild(resource.resourceName)}
                            disabled={loading}
                            style={{ width: '100%' }}
                        >
                            Cancel
                        </Button>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};
