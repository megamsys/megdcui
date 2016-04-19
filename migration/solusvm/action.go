package solusvm

import (
	"fmt"
//	"io"

	log "github.com/Sirupsen/logrus"
	"github.com/megamsys/libgo/action"
	"github.com/megamsys/megdcui/migration/solusvm/api"
//	"github.com/megamsys/libgo/exec"
//	"strings"
)

type runActionsArgs struct {
  masterip    string
  hostip			string
  username    string
  password    string
  id         	string
  key     		string
}

var VertifyMigratableCredentials = action.Action{
	Name: "VertifyMigratableCredentials",
	Forward: func(ctx action.FWContext) (action.Result, error) {
		args := ctx.Params[0].(runActionsArgs)
		fmt.Println("********VertifyMigratableCredentials***************")
		log.Debugf("Solusvm Master  %s ", args.masterip)
		var m api.SolusClient
		m.GetClients(args.masterip,args.id,args.key)
		    fmt.Println()
    log.Debugf("Verified [%s] solusvm master ", args.masterip)
    return &args ,nil

	},
	Backward: func(ctx action.BWContext) {

	},
}
