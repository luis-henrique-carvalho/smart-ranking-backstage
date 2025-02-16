import { makeStyles } from '@material-ui/core';

export const useStyles = makeStyles(theme => ({
  root: { padding: theme.spacing(2) },
  tableHeader: {
    backgroundColor: theme.palette.background.paper,
    fontWeight: 'bold',
  },
  tableRow: {
    '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
  },
  selectContainer: { marginBottom: theme.spacing(2), minWidth: 200 },
  changesContainer: { display: 'flex', justifyContent: 'space-between' },
  box: { display: 'flex', gap: theme.spacing(0.5) },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    textDecoration: 'none',
    padding: theme.spacing(1),
    fontWeight: 'bold',
    color: theme.palette.primary.main,
    borderRadius: theme.shape.borderRadius,
    transition: 'background-color 0.3s, color 0.3s',
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.common.white,
    },
  },
}));
