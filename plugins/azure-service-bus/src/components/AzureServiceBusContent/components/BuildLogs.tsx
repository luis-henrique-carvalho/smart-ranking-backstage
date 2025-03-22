import React, { useEffect, useState, useRef } from "react";
import { useAzureServiceBusApi } from "../../../hooks/useAzureServiceBusApi";
import { CardContent, Typography, CircularProgress } from "@material-ui/core";
import { LogViewer, Progress } from "@backstage/core-components";

interface BuildLog {
    id: number;
    type: string;
}

interface LogValues {
    value: string[];
}

const BuildLogs = () => {
    const { fetchBuildLogs, pipelineRunId, fetchBuildLogsById, loading, setLoading, build, fetchBuildById } = useAzureServiceBusApi();
    const [logs, setLogs] = useState<BuildLog[] | null>(null);
    const [logsValues, setLogsValues] = useState<LogValues[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {

        if (!pipelineRunId) return;

        const loadLogs = async () => {
            if (!build) return;
            if (build.status !== "completed") return;

            try {
                setLoading(true);
                const logsData = await fetchBuildLogs(pipelineRunId);
                const fetchedLogsValues = await Promise.all(
                    logsData?.value.map(async (log: BuildLog) => fetchBuildLogsById(log.id))
                );

                setLogs(logsData?.value || []);
                setLogsValues(fetchedLogsValues);
            } catch (err: any) {
                setError(err.message || "Erro ao carregar logs");
            } finally {
                setLoading(false);
            }
        };

        fetchBuildById(pipelineRunId);
        loadLogs();
    }, [pipelineRunId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logsValues]);

    if (loading) return <Progress />;
    if (error) return <Typography color="error">{error}</Typography>;

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
            {logsValues && logsValues.length > 0 ? (

                <div style={{ height: "50vh", overflowY: "auto" }}>
                    <LogViewer text={logsValues.map((log) => log.value.map((value) => value).join("\n")).join("\n")} />
                </div>
            ) : (
                <Typography color="textSecondary">Nenhum log disponível</Typography>
            )}
        </CardContent>
    );
};

export default BuildLogs;
