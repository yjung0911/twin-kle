import React, { Component } from 'react';

export default class ButtonGroup extends Component {
  render() {
    const { pullRight, buttons } = this.props;
    return (
      <div
        {...this.props}
        className='btn-group'
      >
        {
          buttons.map(button => {
            return (
              <button
                key={buttons.indexOf(button)}
                type="button"
                className={`btn ${button.buttonClass}`}
                onClick={ button.onClick }
                disabled={ button.disabled }
              >
                { button.label }
              </button>
            )
          })
        }
      </div>
    )
  }
}