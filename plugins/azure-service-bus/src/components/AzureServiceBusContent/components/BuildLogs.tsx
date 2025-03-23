import React, { useEffect, useRef } from "react";
import { CardContent, Typography } from "@material-ui/core";
import { LogViewer, Progress } from "@backstage/core-components";
import { BuildLogFull } from "../../../types";

interface BuildLogsProps {
    loading: boolean;
    buildLogsFull: BuildLogFull[] | null;
}

const BuildLogs: React.FC<BuildLogsProps> = ({ loading, buildLogsFull }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            setTimeout(() => {
                console.log("🚀 Scrolling to bottom");
                scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
            }, 1000); // Pequeno atraso para garantir que o conteúdo foi renderizado
        }
    }, [buildLogsFull]);

    if (loading) return <Progress />;
    if (!buildLogsFull || buildLogsFull.length === 0) {
        return <Typography color="textSecondary">Nenhum log disponível</Typography>;
    }

    return (
        <CardContent>
            <div
                ref={scrollRef}
                style={{
                    height: "60vh",
                    overflowY: "auto",
                }}
            >
                <LogViewer text={buildLogsFull.map(log => log.value.join("\n")).join("\n")} />
            </div>
        </CardContent>
    );
};

export default BuildLogs;
