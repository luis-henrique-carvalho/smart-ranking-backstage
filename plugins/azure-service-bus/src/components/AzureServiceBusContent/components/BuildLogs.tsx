import React, { useEffect, useRef } from "react";
import { useAzureServiceBusApi } from "../../../hooks/useAzureServiceBusApi";
import { CardContent, Typography } from "@material-ui/core";
import { LogViewer, Progress } from "@backstage/core-components";


const BuildLogs = ({ pipelineRunId }: { pipelineRunId: number | null }) => {

    const { fetchBuildLogs, build, fetchBuildLogsById, loading, error, buildLogs, buildLogsFull } = useAzureServiceBusApi();

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!pipelineRunId) return;

        console.log("pipelineRunId atualizado:", pipelineRunId);

        const loadLogs = async () => {
            await fetchBuildLogs(pipelineRunId);
            await Promise.all(
                buildLogs ? buildLogs.map(async (log) => fetchBuildLogsById(log.id)) : []
            );
        };

        loadLogs();
    }, [pipelineRunId]); // Agora o efeito só roda quando pipelineRunId muda

    // useEffect(() => {
    //     if (scrollRef.current) {
    //         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    //     }
    // }, [buildLogsFull]);

    if (loading) return <Progress />;
    if (error) return <Typography color="error">{error.message || String(error)}</Typography>;

    return (
        <CardContent
            ref={scrollRef}
            style={{
                maxHeight: "100vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column-reverse",
            }}
        >
            {buildLogsFull && buildLogsFull.length > 0 ? (

                <div style={{ height: "50vh", overflowY: "auto" }}>
                    <LogViewer text={buildLogsFull.map((log) => log.value.map((value) => value).join("\n")).join("\n")} />
                </div>
            ) : (
                <Typography color="textSecondary">Nenhum log disponível</Typography>
            )}
        </CardContent>
    );
};

export default BuildLogs;
