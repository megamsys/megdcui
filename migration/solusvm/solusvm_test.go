package solusvm

import (
  //  "fmt"
    "testing"
    "errors"
    "github.com/megamsys/megdcui/automation"
    "github.com/megamsys/megdcui/meta"
  	"gopkg.in/check.v1"
)

func Test(t *testing.T) {
	check.TestingT(t)
}

var _ = check.Suite(&SolusvmSuite{})

type SolusvmSuite struct {
}

func (s *SolusvmSuite) TestSetConf(c *check.C) {


}

func (s *SolusvmSuite) TestActions(c *check.C) {
	var err = errors.New("testing")
  meta.NewConfig().MkGlobal()
  var a solusvmManager
  h := &automation.HostInfo{
    SolusMaster: "103.56.92.58",
    Id: "iy9rRvifGKajunciPcu5V13ANyAmVnvklN2HV8cv",
    Key: "8mQloZ1rjkl6bevOCW2o0mykZpSLnV8l8OwmCnEN",
    SolusNode: "158.69.240.220",
  }

  a.MigratablePrepare(h)
	c.Assert(err, check.NotNil)
}
