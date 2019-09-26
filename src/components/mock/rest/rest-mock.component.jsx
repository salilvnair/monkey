import React, { Component } from 'react';
import Icon from '@material-ui/core/Icon';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import InputLabel from '@material-ui/core/InputLabel';
import { JsxElectronUtil } from '@salilvnair/jsx-electron';
import ReactJson from 'react-json-view';

export class RestMock extends Component {
    restMockStyles = {
        container: {
          display: 'flex',
          flexWrap: 'wrap',
          flexDirection: 'column',
          marginTop: "50px",
          marginLeft: "200px"
        },
        requestResponseTexfield: {
          display: 'flex',
          flexDirection: 'column',
          marginLeft: "200px",
          marginRight: "380px"
        },
       
        icon: {
          fontSize: 20,
        },
        iconVariant: {
          opacity: 0.9,
          marginRight: 1,
        },
        message: {
          display: 'flex',
          alignItems: 'center',
        },
        selectEmpty: {
          marginTop: 1 * 2,
        },
        portTextField: {
          marginLeft: 200,
          marginRight: 1 * 3,
          width: 125,
        },
        endpointUrlTextField: {
          marginLeft: 1* 3,
          marginRight: 1,
          minWidth: 400
        },
        label: {
            backgroundColor: "white"
        },
        rightIcon: {
            marginLeft: 1,
        },
        button: {
            marginLeft: 500,
            padding: 15,
        },
        dense: {
          marginTop: 16,
        },
        menu: {
          width: 200,
        },
        hide:{
          display:'none'
        },
        close: {
          padding: 1 / 2,
        },
        formControl: {
          margin: 16,
          minWidth: 150,
        },
      };
  state = {
    showStartBtn: true,
    open: false,
    openHttp:false,
    httpMethod: 'get',
    labelWidth: 0,
    incomingRequest:'',
    mockResponse:null,
    mockResponseString:'',
    showJsonViewer:false,
    fontsLoaded: false
  }
  mockResponseInputRef = React.createRef();
  mockResponse;
  selectedPort;  
  endPointUrl;
  infoType = "success";
  infoMessage = "";

  onStartRestMock(){
    if (this.jsxElectronUtil.isElectronApp()) {  
      this.jsxElectronUtil.ipcRenderer.on('incomingRequest/'+this.endPointUrl, (event, arg) => this.processIncomingRequest(event, arg)); 
    }
  }

  processIncomingRequest = (event, arg) => {
    console.log(arg)
    let inR = this.state.incomingRequest +'\n'+ JSON.stringify(arg,null,2);
    this.setState({incomingRequest:inR});
  }

  onChangeMockResponse(event) {
    this.mockResponse = event.target.value;
    this.setState({mockResponseString:event.target.value});
    this.prepareMonkeyAction();
  } 

  prepareMonkeyAction = () => {
    const { httpMethod } = this.state;
    let monkeyResponse = null;
    if(this.isValidJson(this.mockResponse)) {
      monkeyResponse = JSON.parse(this.mockResponse)
    }
    let monkeyAction = {
      "response":monkeyResponse,
      "httpMethod":httpMethod,
      "endPointUrl":this.endPointUrl
    } 
    this.props.performMonkeyAction(monkeyAction, httpMethod+"/"+this.endPointUrl, this.props.index);
  }

  showJsonViewInput = (e) => {
    if(this.isValidJson(this.mockResponse)) {
      this.setState({mockResponse: JSON.parse(this.mockResponse), showJsonViewer:true})
    }
  }

  isValidJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
  }

  onChangeEndPointUrl(event) {
    this.endPointUrl = event.target.value;
    this.props.changeMockTabValue(this.props.index, this.endPointUrl);
  } 

  componentDidMount() {
    this.jsxElectronUtil = new JsxElectronUtil();
  }

  handleHttpChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleHttpClose = () => {
    this.setState({ openHttp: false });
  };

  showResponseInput = (e) => {
    //this.mockResponseInputRef.current.focus();
    this.setState({showJsonViewer:false});
  }

  handleHttpOpen = () => {
    this.setState({ openHttp: true });
  };

  renderView() {
      return(
        <div>
        <form style={this.restMockStyles.container} noValidate autoComplete="off">
        <div>
          <div style={{display: 'flex', marginLeft:185}}>
          <FormControl variant="outlined" style={this.restMockStyles.formControl}>
          <InputLabel
            ref={ref => {
              this.InputLabelRef = ref;
            }}
            htmlFor="outlined-age-simple"
          >
            HTTP METHOD
          </InputLabel>
          <Select
            value={this.state.httpMethod}
            onChange={this.handleHttpChange}
            input={
              <OutlinedInput
                labelWidth={this.state.labelWidth}
                name="httpMethod"
                id="outlined-age-simple"
              />
            }
          >
            <MenuItem value="get">Get</MenuItem>
            <MenuItem value="post">Post</MenuItem>
          </Select>
        </FormControl>
            <TextField
                id="filled-with-placeholder"
                label="Endpoint URL "
                key={this.props.index}
                style={this.restMockStyles.endpointUrlTextField}
                margin="normal"
                variant="outlined"
                InputProps={{
                  startAdornment: <InputAdornment position="start">/</InputAdornment>,
                }}
                onChange={(e)=>{this.onChangeEndPointUrl(e)}}
            />
          </div>
            {
            
            this.state.showJsonViewer?
            <div>
              
              <div style={{display: 'flex', justifyContent:'center'}} >
                <Icon 
                  onClick={this.showResponseInput}
                  style={this.restMockStyles.rightIcon}>edit</Icon>
              </div>
              <ReactJson 
                enableClipboard={false}
                displayDataTypes={false}
                iconStyle="square"
                collapsed={1}
                indentWidth={5}
                name={false}
                collapseStringsAfterLength={40}
                style={{ marginLeft:"200px", textAlign: "left", fontSize: "18px"}}
              src={this.state.mockResponse} />
            </div>
            
              :
              <TextField
                id="filled-with-placeholder"
                label="Paste/Write Response"
                ref={this.mockResponseInputRef}
                style={this.restMockStyles.requestResponseTexfield}
                margin="normal"
                multiline
                variant="outlined"
                value={this.state.mockResponseString}
                autoFocus
                onChange={(e)=>{this.onChangeMockResponse(e)}}
                onBlur={(e)=>{this.showJsonViewInput(e)}}
            />}
            <TextField
                id="filled-with-placeholder"
                label="Incoming Request"
                style={this.restMockStyles.requestResponseTexfield}
                margin="normal"
                multiline                
                variant="outlined"
                value={this.state.incomingRequest}
            />
            </div>
        </form>
      </div>
      );
  }

  render() {
    return (
        <>
            {this.renderView()}
        </>
    )
  }
}

export default RestMock;