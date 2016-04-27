package api

import (
//  "fmt"
  "testing"
  "gopkg.in/check.v1"
  //"github.com/megamsys/megdcui/automation"
)

func Test(t *testing.T) {
	check.TestingT(t)
}

var _ = check.Suite(&S{})

type S struct {
}
/*

func (s *S) TestSetConf(c *check.C) {
  h := &automation.HostInfo{
    SolusMaster:  "103.56.92.58",
		Id: "iy9rRvifGKajunciPcu5V13ANyAmVnvklN2HV8cv",
		Key: "8mQloZ1rjkl6bevOCW2o0mykZpSLnV8l8OwmCnEN",
		SolusNode: "158.69.240.220",
  }
  var m SolusClient
  err := m.GenVirtualMachines(h)
  c.Assert(err,check.NotNil)
}
*/
