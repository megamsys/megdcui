/*
** copyright [2013-2016] [Megam Systems]
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

package provision

import (
	"bytes"

	log "github.com/Sirupsen/logrus"
	"github.com/megamsys/libgo/cmd"

	//"io"
	"fmt"
	//"strings"
	"time"
)

type DeployData struct {

}

type DeployOpts struct {
	B *Box
}

// Deploy runs a deployment of an application. It will first try to run an
// image based deploy, and then fallback to the Git based deployment.
func Deploy(opts *DeployOpts) error {
	var outBuffer bytes.Buffer
	start := time.Now()
	_, err := deployToProvisioner(opts)
	elapsed := time.Since(start)
	saveErr := saveDeployData(opts,outBuffer.String(), elapsed, err)
	if saveErr != nil {
		log.Errorf("WARNING: couldn't save deploy data, deploy opts: %#v", opts)
	}
	if err != nil {
		return err
	}
	return nil
}

func deployToProvisioner(opts *DeployOpts) (string, error) {
	fmt.Println("***********************************************")
	fmt.Println(opts)
	if opts.B.BaseUrl != "" && opts.B.Id != "" && opts.B.Key != "" {
		if deployer, ok := ProvisionerMap[opts.B.Provider].(GitDeployer); ok {
			return deployer.GitDeploy(opts.B)
		}
	}
	return "Deployed in zzz!", nil
}


func saveDeployData(opts *DeployOpts, dlog string, duration time.Duration, deployError error) error {
	log.Debugf("%s in (%s)\n%s",
		cmd.Colorfy("kvm101", "cyan", "", "bold"),
		cmd.Colorfy(duration.String(), "green", "", "bold"),
		cmd.Colorfy(dlog, "yellow", "", ""))
	//if there are deployments to track as follows in outputs: {} then do it here.
	//Riak: code to save the status of a deploy (created.)
	// deploy :
	//     name:
	//     status:

	/*deploy := DeployData {
		App:       opts.App.Name,
		Timestamp: time.Now(),
		Duration:  duration,
		Commit:    opts.Commit,
		Image:     imageId,
		Log:       log,
	}
	if opts.Commit != "" {
		deploy.Origin = "git"
	} else if opts.Image != "" {
		deploy.Origin = "rollback"
	} else {
		deploy.Origin = "app-deploy"
	}
	if deployError != nil {
		deploy.Error = deployError.Error()
	}
	return db.Store(compid or assmid, &struct)
	*/
	return nil
}
