import React from 'react'
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

 class TabPanel extends React.Component {
    render() {
        const { children, value, index, ...other } = this.props;
        return (
            <Typography
                component="div"
                role="tabpanel"
                hidden={value !== index}
                id={`scrollable-auto-tabpanel-${index}`}
                aria-labelledby={`scrollable-auto-tab-${index}`}
                {...other}
            >
                <Box p={3}>{children}</Box>
            </Typography>
        );
    }
  }

  export default TabPanel;
  