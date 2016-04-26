package run
/*
import (
	"fmt"
	"strings"
	"github.com/BurntSushi/toml"
	"gopkg.in/check.v1"
)

// Ensure the configuration can be parsed.
func (s *S) TestConfig_Parse(c *check.C) {
	var cm *Config = NewConfig()
	path := cm.Meta.Dir + "/megdcui.conf"

	c.Assert((len(strings.TrimSpace(path)) > 0), check.Equals, true)
	if _, err := toml.DecodeFile(path, cm); err != nil {
		fmt.Println(err.Error())
	}

	c.Assert(cm, check.NotNil)
	c.Assert(cm.Meta.Scylla, check.DeepEquals, []string{"192.168.1.247"})
}
*/
