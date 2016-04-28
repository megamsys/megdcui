package machine

import (
	"fmt"
	log "github.com/Sirupsen/logrus"
	"github.com/megamsys/libgo/action"
	"github.com/megamsys/megdcui/install/host"
)

type runActionsArgs struct {

  username    string
  password    string
	host        string
	bridgename      string
  phydev       string
	network      string
	netmask      string
	gateway      string
	dnsname1     string
	dnsname2     string
}


var CheckHostInfo = action.Action{
	Name: "CheckHostInfo",
	Forward: func(ctx action.FWContext) (action.Result, error) {
		args := ctx.Params[0].(runActionsArgs)

		log.Debugf("Host  %s ", args.host)
		var m host.HostInfo
		m.GetHostInfo(args.host,args.username,args.password)
		    fmt.Println()
    log.Debugf("Verified [%s] host ", args.host)
    return &args ,nil

	},
	Backward: func(ctx action.BWContext) {

	},
}


var HostCheck = action.Action{
	Name: "CheckHostCheck",
	Forward: func(ctx action.FWContext) (action.Result, error) {
		args := ctx.Params[0].(runActionsArgs)

		log.Debugf("Host  %s ", args.host)
		var m host.HostCheck
		m.GetHostCheck(args.host,args.username,args.password)
		    fmt.Println()
    log.Debugf("Verified [%s] host ", args.host)
    return &args ,nil

	},
	Backward: func(ctx action.BWContext) {

	},
}

var OneHostInstall = action.Action{
	Name: "OneHostInstall",
	Forward: func(ctx action.FWContext) (action.Result, error) {
		args := ctx.Params[0].(runActionsArgs)

		log.Debugf("Host  %s ", args.host)
		var m host.Onehostinstall
		m.InstallOneHost(args.host,args.username,args.password)
		    fmt.Println()
    log.Debugf("Verified [%s] host ", args.host)
    return &args ,nil

	},
	Backward: func(ctx action.BWContext) {

	},
}
var CreateBridgeAction = action.Action{
	Name: "CreateBridge",
	Forward: func(ctx action.FWContext) (action.Result, error) {
		args := ctx.Params[0].(runActionsArgs)

		log.Debugf("Host  %s ", args.host)
		var m host.CreateBridge
		m.Bridge(args.bridgename, args.phydev, args.network, args.netmask, args.gateway, args.dnsname1, args.dnsname2, args.host, args.username, args.password)
		    fmt.Println()
    log.Debugf("Verified [%s] host ", args.host)
    return &args ,nil

	},
	Backward: func(ctx action.BWContext) {

	},
}
