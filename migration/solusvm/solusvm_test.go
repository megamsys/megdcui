package solusvm

import (
    "fmt"
    "testing"
    "errors"
    "github.com/megamsys/megdcui/automation"
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
  h := &automation.HostInfo{
    SolusMaster: "103.56.92.58",
    Id: "LSYbwzuPTvnGq5O3t9VwHV3F6S9m1NXAvMCSbXxV",
    Key: "jMqzG6rZ4dmAYf6UX57NIUe4wHMyuakFMA5iwm9p",
    SolusNode: "158.69.240.220",
  }

  a.MigratablePrepare(h)
	c.Assert(err, check.NotNil)
}
