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
	"bytes"
	"fmt"
//	"io"
	"strings"
	"text/tabwriter"

	"github.com/megamsys/libgo/action"
	"github.com/megamsys/libgo/cmd"
	"github.com/megamsys/megdcui/provision"
)

var mainSolusProvisioner *solusProvisioner

func init() {
	mainSolusProvisioner = &solusProvisioner{}
	provision.Register("one", mainSolusProvisioner)
}

type solusProvisioner struct {
}

func (p *solusProvisioner) StartupMessage() (string, error) {
	w := new(tabwriter.Writer)
	var b bytes.Buffer
	w.Init(&b, 0, 8, 0, '\t', 0)
	b.Write([]byte(cmd.Colorfy("  > one ", "white", "", "bold") + "\t" +
		cmd.Colorfy("kvm101", "cyan", "", "")))
	fmt.Fprintln(w)
	w.Flush()
	return strings.TrimSpace(b.String()), nil
}

func (p *solusProvisioner) GitDeploy(box *provision.Box) (string, error) {
	return p.deployPipeline(box)
}

//start by validating the image.
//1. &updateStatus in Riak - Deploying..
//2. &create an inmemory machine type from a Box.
//3. &updateStatus in Riak - Creating..
//4. &followLogs by posting it in the queue.
func (p *solusProvisioner) deployPipeline(box *provision.Box) (string, error) {
	fmt.Printf( "\n--- deploy box (%s, image)\n", "kvm101")
	actions := []*action.Action{
		&updateStatusInSolus,
	//	&createMachine,
	}
	pipeline := action.NewPipeline(actions...)

	args := runMachineActionsArgs{
		box:           box,
		isDeploy:      true,
		provisioner:   p,
	}

	err := pipeline.Execute(args)
	if err != nil {
		fmt.Printf( "\n--- deploy pipeline for box \n --> %s", err)
		return "", err
	}
	fmt.Printf( "\n--- deploy box  OK\n")
	return "imageId", nil
}

func (p *solusProvisioner) Start(box *provision.Box, process string) error {
	fmt.Printf("\n--- starting box \n")
	args := runMachineActionsArgs{
		box:           box,
		isDeploy:      false,
		provisioner:   p,
	}

	actions := []*action.Action{
		&updateStatusInSolus,
	}

	pipeline := action.NewPipeline(actions...)

	err := pipeline.Execute(args)
	if err != nil {
		fmt.Printf("\n--- starting box (%s)\n --> %s",  err)
		return err
	}
	fmt.Printf("\n--- starting box (%s) OK\n")
	return nil
}

func (p *solusProvisioner) ExecuteCommandOnce(box *provision.Box, cmd string, args ...string) error {
	/*if boxs, err := p.listRunnableMachinesByBox(box.GetName()); err ! =nil {
					return err
	    }

		if err := nil; err != nil {
			return err
		}
		if len(boxs) == 0 {
			return provision.ErrBoxNotFound
		}
		box := boxs[0]
		return box.Exec(p, stdout, stderr, cmd, args...)
	*/
	return nil
}
