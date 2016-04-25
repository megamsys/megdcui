package solusvm

import (

	log "github.com/Sirupsen/logrus"
	"github.com/megamsys/libgo/action"
	"github.com/megamsys/megdcui/migration/solusvm/api"
	"github.com/megamsys/megdcui/automation"
//	"github.com/megamsys/libgo/exec"
//	"strings"
)

type runActionsArgs struct {
  h *automation.HostInfo
	//orgs *automation.Organizations
//	acts *automation.Accounts
}

var VertifyMigratableCredentials = action.Action{
	Name: "VertifyMigratableCredentials",
	Forward: func(ctx action.FWContext) (action.Result, error) {
		args := ctx.Params[0].(runActionsArgs)

		log.Debugf("Solusvm Master  %s ", args.h.SolusMaster)
		var m api.SolusClient
		err := m.GetNodes(args.h)

    if err != nil {
			return nil , err
		}
    log.Debugf("Verified [%s] solusvm master ", args.h.SolusMaster)
    return &args ,nil

	},
	Backward: func(ctx action.BWContext) {

	},
}

var VerfiyMigrationComplete = action.Action{
	Name: "VerfiyMigrationComplete",
	Forward: func(ctx action.FWContext) (action.Result, error) {
		args := ctx.Params[0].(runActionsArgs)

		log.Debugf("Solusvm Master  %s ", args.h.SolusMaster)


    log.Debugf("Verified [%s] solusvm master ", args.h.SolusMaster)
    return &args ,nil

	},
	Backward: func(ctx action.BWContext) {

	},
}

var ListClientsInMigratable = action.Action{
	Name: "ListClientsInMigratable",
	Forward: func(ctx action.FWContext) (action.Result, error) {
		args := ctx.Params[0].(runActionsArgs)

		log.Debugf("Solusvm Master  %s ", args.h.SolusMaster)
		var m api.SolusClient
		err := m.GetClients(args.h)
		if err != nil {
			return nil , err
		}

    log.Debugf("Verified [%s] solusvm master ", args.h.SolusMaster)
    return &args ,nil

	},
	Backward: func(ctx action.BWContext) {

	},
}

var OnboardInVertice = action.Action{
	Name: "OnboardInVertice",
	Forward: func(ctx action.FWContext) (action.Result, error) {
		args := ctx.Params[0].(runActionsArgs)

		log.Debugf("Solusvm Master  %s ", args.h.SolusMaster)


    log.Debugf("Verified [%s] solusvm master ", args.h.SolusMaster)
    return &args ,nil

	},
	Backward: func(ctx action.BWContext) {

	},
}


var ListVMsinMigratable = action.Action{
	Name: "ListVMsinMigratable",
	Forward: func(ctx action.FWContext) (action.Result, error) {
		args := ctx.Params[0].(runActionsArgs)

		log.Debugf("Solusvm Master  %s ", args.h.SolusMaster)


    log.Debugf("Verified [%s] solusvm master ", args.h.SolusMaster)
    return &args ,nil

	},
	Backward: func(ctx action.BWContext) {

	},
}

var TagMigratableInVertice = action.Action{
	Name: "TagMigratableInVertice",
	Forward: func(ctx action.FWContext) (action.Result, error) {
		args := ctx.Params[0].(runActionsArgs)

		log.Debugf("Solusvm Master  %s ", args.h.SolusMaster)
		var m api.SolusClient
		err := m.GenVirtualMachines(args.h)
		if err != nil {
			return nil , err
		}

    log.Debugf("Verified [%s] solusvm master ", args.h.SolusMaster)
    return &args ,nil

	},
	Backward: func(ctx action.BWContext) {

	},
}
