import React from "react";
import { Button, CardContent, Typography, makeStyles } from "@material-ui/core";
import { LogViewer } from "@backstage/core-components";
import { BuildLogFull } from "../../../types";
import ArrowDownward from "@material-ui/icons/ArrowDownward"; // Importe o ícone
import Skeleton from "@material-ui/lab/Skeleton"; // Importe o Skeleton

interface BuildLogsProps {
    buildLogsDetails: BuildLogFull[] | null;
}

const BuildLogs: React.FC<BuildLogsProps> = ({ buildLogsDetails }) => {

    const useStyles = makeStyles({
        logViewerRoot: {
            padding: '5px',
        },
    });

    const classes = useStyles();

    const scrollToBottom = () => {
        const logViewerInnerDiv = document.querySelector(
            'div[class^="BackstageLogViewer-log-"]',
        );
        if (logViewerInnerDiv) {
            logViewerInnerDiv.scrollTo({ top: logViewerInnerDiv.scrollHeight, behavior: "smooth" });
        }
    };

    if (!buildLogsDetails) {
        return <Skeleton variant="rect" width="100%" height="60vh" />;
    }

    if (!buildLogsDetails || buildLogsDetails.length === 0) {
        return <Typography color="textSecondary">Nenhum log disponível</Typography>;
    }

    return (
        <CardContent>
            <div
                style={{
                    minHeight: "60vh",
                }}
            >
                <LogViewer
                    text={buildLogsDetails.map((log) => log.value.join("\n")).join("\n")}
                    classes={{
                        root: classes.logViewerRoot,
                    }}
                />

                {buildLogsDetails && (
                    <Button
                        variant="outlined"
                        color="default"
                        onClick={scrollToBottom}
                        style={{
                            position: "relative",
                            zIndex: 1000,
                            minWidth: "auto",
                            left: "calc(5%)",
                        }}
                    >
                        <ArrowDownward />
                    </Button>
                )}
            </div>
        </CardContent>
    );
};

export default BuildLogs;
