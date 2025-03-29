import React from 'react';
import { Modal, Box, Typography, Button, makeStyles } from '@material-ui/core';

type ReprocessModalProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
};

const useStyles = makeStyles(theme => ({
    modal: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[24],
        padding: theme.spacing(4),
    },
}));

const ReprocessModal: React.FC<ReprocessModalProps> = ({ open, onClose, title, children }) => {
    const classes = useStyles();

    return (
        <Modal open={open} onClose={onClose}>
            <Box className={classes.modal}>
                <Typography variant="h6" gutterBottom>{title}</Typography>
                {children}
                <Button variant="contained" color="secondary" onClick={onClose} fullWidth>
                    Fechar
                </Button>
            </Box>
        </Modal>
    );
};

export default ReprocessModal;
