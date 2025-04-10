import React from 'react';
import { Grid, Typography, Chip } from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';

interface InfoCardTitleProps {
    buildView: {
        buildId: number;
        status: string;
    };
}

const InfoCardTitle = ({ buildView }: InfoCardTitleProps) => {
    const theme = useTheme();

    const getChipColor = (status: string) => {
        switch (status) {
            case 'running':
                return theme.palette.status.running;
            case 'completed':
                return theme.palette.status.ok;
            case 'queued':
                return theme.palette.status.pending;
            case 'failed':
                return theme.palette.status.error;
            default:
                return theme.palette.text.secondary;
        }
    };

    return (
        <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
                <Typography variant="h6">
                    <strong>Build Logs:</strong> #{buildView.buildId}
                </Typography>
            </Grid>
            <Grid item>
                <Chip
                    label={buildView.status}
                    size="small"
                    style={{
                        backgroundColor: getChipColor(buildView.status),
                        color: '#fff',
                        fontWeight: 500,
                        textTransform: 'capitalize',
                    }}
                />
            </Grid>
        </Grid>
    );
};

export default InfoCardTitle;
