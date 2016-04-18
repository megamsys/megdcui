package api

import (
	"encoding/json"
	"net/http"
	"fmt"

	//"github.com/megamsys/libgo/hc"
	//_ "github.com/megamsys/megdcui/hc"
  "github.com/megamsys/megdcui/provision"
)

func migrate(w http.ResponseWriter, r *http.Request) error {
	data, _ := json.MarshalIndent(fullHealthcheck(w, r), "", "  ")
	fmt.Println("*************************************")
	fmt.Println(data)
  b :=&provision.Box{
    BaseUrl: "https://103.56.92.58:5656/api/admin/command.php",
    Id: "sedfwesdvsdghfh",
    Key: "fdfrg45dgvg24db",
  }
	err :=provision.Deploy(&provision.DeployOpts{B: b})

	if err != nil {
		return err
	}
	return nil
}
