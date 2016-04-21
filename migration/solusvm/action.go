package solusvm

import (
	"fmt"
//	"io"

	log "github.com/Sirupsen/logrus"
	"github.com/megamsys/libgo/action"
	"github.com/megamsys/megdcui/migration/solusvm/api"
	"github.com/megamsys/megdcui/automation"
//	"github.com/megamsys/libgo/exec"
//	"strings"
)

type runActionsArgs struct {
  h *automation.HostInfo
}

var VertifyMigratableCredentials = action.Action{
	Name: "VertifyMigratableCredentials",
	Forward: func(ctx action.FWContext) (action.Result, error) {
		args := ctx.Params[0].(runActionsArgs)

		log.Debugf("Solusvm Master  %s ", args.h.SolusMaster)
		var m api.SolusClient
		err := m.GetClients(args.h)
    if err != nil {
			return nil , err
		}
		fmt.Println()
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
		var m api.SolusClient
		err := m.GetClients(args.h)
    if err != nil {
			return nil , err
		}
		fmt.Println()
    log.Debugf("Verified [%s] solusvm master ", args.h.SolusMaster)
    return &args ,nil

	},
	Backward: func(ctx action.BWContext) {

	},
}
