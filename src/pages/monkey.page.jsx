
import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import TabPanel from '../components/tab-panel/tab-panel.component';
import { RestMock } from '../components/mock/rest/rest-mock.component';
import TextField from '@material-ui/core/TextField';
import Snackbar from '@material-ui/core/Snackbar';
import CustomSnackBar from '../components/snackbar/custom-snackbar.component';
import { JsxElectronUtil } from '@salilvnair/jsx-electron';
import LinearProgress from '@material-ui/core/LinearProgress';


class Monkey extends React.Component {
    state={
        tabValue:0,
        mockTabs:{},
        tabs: [0],
        showStartBtn: true,
        monkeyActions: {},
        monkeyActionTabIndex: {},
        selectedPort:''
    }
    restMockRefs = [];
    infoType = "success";
    infoMessage = "";
    selectedPort;

    setRestMockRef  = (ref) => {
        this.restMockRefs.push(ref);//
    };

    performMonkeyAction = (action, context, index) => {
        let { monkeyActions, monkeyActionTabIndex} = this.state;
        let newMonkeyActions = {...monkeyActions};
        let newMonkeyActionTabIndex = {...monkeyActionTabIndex};
        newMonkeyActions[context] = action;
        newMonkeyActionTabIndex[index]=context;
        this.setState({monkeyActions:newMonkeyActions, monkeyActionTabIndex:newMonkeyActionTabIndex});
    }

    changeMockTabValue = (index, value) => {
        let mockTabs = this.state.mockTabs;

        mockTabs[index] = value;
        this.setState({mockTabs:mockTabs});
    }

    handleChange = (e, newValue) => {
        this.setState({tabValue:newValue});
    }

    handleTabChange= (value) => {
        this.setState({tabValue:value});
    }

    componentDidMount() {
        this.jsxElectronUtil = new JsxElectronUtil();
    }
    

    a11yProps(index) {
        return {
          id: `scrollable-auto-tab-${index}`,
          'aria-controls': `scrollable-auto-tabpanel-${index}`,
        };
    }

    removeTab = () => {
        let {  tabs, mockTabs } = this.state;
        let lastIndex = tabs.length-1;
        tabs.pop();
        this.restMockRefs.pop();
        if(lastIndex!==-1) {
            if(mockTabs[lastIndex]){
                let mockTabsNew = {...mockTabs};
                delete mockTabsNew[lastIndex];
                this.setState({mockTabs:mockTabsNew})
            }
            this.setState({tabValue:lastIndex-1});
            this.killMonkeyActionHandler(lastIndex);
        }
        this.setState({tabs:tabs});
    }

    killMonkeyActionHandler = (index) => {
        let {monkeyActions, monkeyActionTabIndex} = this.state;
        if(monkeyActionTabIndex[index]) {
            this.jsxElectronUtil.ipcRenderer.send('killMonkeyActionHandler', monkeyActions[monkeyActionTabIndex[index]]); 
            let newMonkeyActions = {...monkeyActions};
            delete newMonkeyActions[monkeyActionTabIndex[index]];
            this.setState({monkeyActions:newMonkeyActions})
        }
    }

    addTab = () => {
        let {  tabs } = this.state;
        tabs.push(tabs.length+1);
        this.setState({tabs:tabs});
        let lastIndex = tabs.length-1;
        this.setState({tabValue:lastIndex})
    }

    showTab = () => {
        const { mockTabs, tabs } = this.state;
        return (
            tabs.map((tab, index)=>{
                return (
                    <Tab 
                        key={index} 
                        onClick={()=>this.handleTabChange(index)} 
                        label={
                            <div>
                                {mockTabs[index]?mockTabs[index]:"Mock "+(index+1)}
                            </div>
                        } 
                        {...this.a11yProps(index)} />    
                );  
            })
        );
    }

    handleClose = (event, reason) => {
        if (reason === 'clickaway') {
          return;
        }
    
        this.setState({ open: false });
    };

    showTabPanel = () => {
        const { tabValue, tabs } = this.state;
        return (
            tabs.map((tab, index)=>{
                return (
                    <TabPanel key={index} value={tabValue} index={index}>
                        <RestMock 
                            ref={this.setRestMockRef} 
                            index={index} 
                            performMonkeyAction={this.performMonkeyAction}
                            changeMockTabValue={this.changeMockTabValue}  {...this.props} />
                    </TabPanel>  
                );  
            })
        );
    }

    onChangePort(event) {
        this.selectedPort = event.target.value; 
        if(isNaN(this.selectedPort)){
            this.selectedPort = '';
        }
        this.setState({selectedPort:this.selectedPort}); 
    }  
    onStartRestMock(e){
        if (this.jsxElectronUtil.isElectronApp()) {  
            this.jsxElectronUtil.ipcRenderer.send('isPortAvailable',this.selectedPort);    
            this.jsxElectronUtil.ipcRenderer.once('isPortAvailable',(event, arg)=> {
                this.listenPortStatus(arg);
            });
            this.restMockRefs.forEach(restMockRef => {
                if(restMockRef) {
                    restMockRef.onStartRestMock();
                }
            })
        }
    }

    onStopRestMock() {
        this.jsxElectronUtil.ipcRenderer.removeAllListeners();
        this.jsxElectronUtil.ipcRenderer.send('shutdown');
        this.setState({ showStartBtn: true });
      }

    listenPortStatus = (portAvailable) => {
        const { monkeyActions } = this.state;
        if(portAvailable){
          let monkeyData = {
            monkeyActions:monkeyActions,
            port: this.selectedPort
          }  
          this.jsxElectronUtil.ipcRenderer.send('monkeyData', monkeyData);
          this.setState({ showStartBtn: false });
          this.infoType= 'success';
          this.infoMessage = 'Monkey started mocking on port '+ this.selectedPort +'!';
        }
        else{
          this.infoType= 'error';
          this.infoMessage = 'Port '+ this.selectedPort +' is already in use please use a different port!';
        }
        this.handleClick();
    }


    handleClick = () => {
        this.setState({ open: true });
    };

    render() {
        const { tabValue, tabs, selectedPort } = this.state;
        return(
            <>
            <AppBar position="static" color="default">
            <div style={{margin:'20px', display:'flex', justifyContent:'center'}}>
                <div>
                <TextField
                    id="filled-with-placeholder"
                    label="Port #"
                    style={{ 
                        marginLeft: 200,
                        marginRight: 1 * 3,
                        width: 125,
                    }}
                    margin="normal"
                    variant="outlined"
                    value={selectedPort}
                    onChange={(e)=>{this.onChangePort(e)}}
                />
                </div>
                <div style={{margin:20}}>
                {this.state.showStartBtn ? (
                <div>
                  <Button 
                    id="startServerBtn"
                    variant="contained" color="primary"
                    style={{padding:12}}
                    disabled={!this.selectedPort}
                    onClick={(e)=>{this.onStartRestMock(e)}}
                    >
                        Start
                        <Icon>send</Icon>
                  </Button>
                  </div>
              ):(
                  <div>
                    <Button 
                      id="stopServerBtn"
                      style={{padding:12}}
                      variant="contained" color="secondary"
                      onClick={()=>{this.onStopRestMock()}}
                      >
                          Stop
                          <Icon>stop</Icon>
                    </Button>

                    <LinearProgress color="secondary"/>
                  </div>
              )
            }
                </div>
                
             </div>
             <div style={{display:'flex'}}>
                 <div style={{maxWidth: 1385,minWidth: 1385}}>
                    <Tabs
                        value={tabValue}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="scrollable"
                        scrollButtons="auto"
                        aria-label="scrollable auto tabs example"
                        >
                        {
                            this.showTab()
                        }                                        
                    </Tabs>
                 </div>
             
            <div style={{display:'flex', justifyContent:'flex-end'}}>
             <Button 
                    style={{margin:'0px 10px', backgroundColor:`${tabs.length<2 ? '':'red' }`}}
                    variant="contained" color="secondary"
                    onClick={this.removeTab}
                    disabled={tabs.length<2}
                    >
                        <Icon>remove</Icon>
             </Button>
             <Button 
                    style={{margin:'0px 0px'}}
                    variant="contained" color="primary"
                    onClick={this.addTab}
                    >
                        <Icon>add</Icon>
             </Button>
            </div>
             </div>
            
            
          </AppBar>
          {
                this.showTabPanel()
          }
          <Snackbar
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                open={this.state.open}
                autoHideDuration={6000}
                onClose={this.handleClose}
                >
                  <CustomSnackBar
                    onClose={this.handleClose}
                    variant={this.infoType}
                    message={this.infoMessage}

                  />
              </Snackbar>          
          </>
        );
    }
}
 

export default Monkey;