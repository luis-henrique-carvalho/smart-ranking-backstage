import { Grid, Typography } from '@material-ui/core'
import React from 'react'

interface InfoCardTitleProps {
    buildView: any;
}

const InfoCardTitle = ({ buildView }: InfoCardTitleProps) => {
    return (
        <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
                <Typography variant="h6">Build Logs: #{buildView.buildId}</Typography>
            </Grid>
            <Grid item>
                <Typography variant="body2" color="textSecondary">
                    Status: {buildView.status}
                </Typography>
            </Grid>
        </Grid>
    )
}

export default InfoCardTitle
