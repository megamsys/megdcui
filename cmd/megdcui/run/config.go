package run

import (
	"errors"

	"github.com/megamsys/megdcui/meta"
	"github.com/megamsys/megdcui/subd/httpd"
)

type Config struct {
	Meta    *meta.Config     `toml:"meta"`
	HTTPD   *httpd.Config    `toml:"http"`
}

func (c Config) String() string {
	return ("\n" +
		c.Meta.String() +
		c.HTTPD.String())

}

// NewConfig returns an instance of Config with reasonable defaults.
func NewConfig() *Config {
	c := &Config{}
	c.Meta = meta.NewConfig()
	c.HTTPD = httpd.NewConfig()
	return c
}

// NewDemoConfig returns the config that runs when no config is specified.
func NewDemoConfig() (*Config, error) {
	c := NewConfig()
	return c, nil
}

// Validate returns an error if the config is invalid.
func (c *Config) Validate() error {
	if c.Meta.Dir == "" {
		return errors.New("Meta.Dir must be specified")
	}
	return nil
}
