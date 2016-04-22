package solusvm

import (

    "testing"
    "errors"

  	"gopkg.in/check.v1"
)

func Test(t *testing.T) {
	check.TestingT(t)
}

var _ = check.Suite(&SolusvmSuite{})

type SolusvmSuite struct {
}

func (s *SolusvmSuite) TestActions(c *check.C) {
	var err = errors.New("testing")
  var a solusvmManager
  a.MigratablePrepare("103.56.92.58", "asdf", "asdf")
	c.Assert(err, check.NotNil)
}
