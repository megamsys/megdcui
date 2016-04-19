/*
** Copyright [2013-2016] [Megam Systems]
**
** Licensed under the Apache License, Version 2.0 (the "License");
** you may not use this file except in compliance with the License.
** You may obtain a copy of the License at
**
** http://www.apache.org/licenses/LICENSE-2.0
**
** Unless required by applicable law or agreed to in writing, software
** distributed under the License is distributed on an "AS IS" BASIS,
** WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
** See the License for the specific language governing permissions and
** limitations under the License.
 */
package solusvm

import (
//	"errors"
	"fmt"
	"io"
	"io/ioutil"

//	log "github.com/Sirupsen/logrus"
	"github.com/megamsys/libgo/action"
	"github.com/megamsys/megdcui/provision"
	"github.com/megamsys/megdcui/provision/solusvm/machine"
)

const (
	START   = "start"
	STOP    = "stop"
	RESTART = "restart"
)

type runMachineActionsArgs struct {
	box           *provision.Box
	writer        io.Writer
	imageId       string
	isDeploy      bool
	machineStatus provision.Status
	provisioner   *solusProvisioner
}

//If there is a previous machine created and it has a status, we use that.
// eg: if it we have deployed, then make it created after a machine is created in ONE.
var updateStatusInSolus = action.Action{
	Name: "update-status-solus",
	Forward: func(ctx action.FWContext) (action.Result, error) {
		args := ctx.Params[0].(runMachineActionsArgs)
		writer := args.writer
		if writer == nil {
			writer = ioutil.Discard
		}
		fmt.Fprintf(writer, "  update status for machine (%s)\n", args.machineStatus.String())
    var mach machine.Machine


		fmt.Fprintf(writer, "  update status for machine (%s, %s) OK\n", args.machineStatus.String())
		return mach, nil
	},
	Backward: func(ctx action.BWContext) {
		c := ctx.FWResult.(machine.Machine)
		c.SetStatus(provision.StatusError)
	},
}


var rollbackNotice = func(ctx action.FWContext, err error) {
	args := ctx.Params[0].(runMachineActionsArgs)
	if args.writer != nil {
		fmt.Fprintf(args.writer, "\n==> ROLLBACK     \n%s\n", err)
	}
}
