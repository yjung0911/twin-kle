import PropTypes from 'prop-types'
import React from 'react'

CheckListGroup.propTypes = {
  inputType: PropTypes.string,
  listItems: PropTypes.arrayOf(PropTypes.shape({
    checked: PropTypes.bool.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  onSelect: PropTypes.func.isRequired,
  style: PropTypes.object
}
export default function CheckListGroup({listItems, inputType, onSelect, style}) {
  return (
    <div
      className="row container-fluid unselectable"
      style={style}
    >
      <form>
        {listItems.map((listItem, index) => {
          let leftStyle = {
            borderTopLeftRadius: '0px',
            borderBottomLeftRadius: '0px',
            borderBottom: 'none'
          }
          let rightStyle = {
            borderTopRightRadius: '0px',
            borderBottomRightRadius: '0px',
            borderTopLeftRadius: '0px',
            borderBottomLeftRadius: '0px',
            borderBottom: 'none'
          }
          if (index === 0 && listItems.length !== 1) {
            leftStyle = {
              borderBottomLeftRadius: '0px',
              borderBottom: 'none'
            }
            rightStyle = {
              borderTopRightRadius: '5px',
              borderBottomRightRadius: '0px',
              borderBottomLeftRadius: '0px',
              borderBottom: 'none'
            }
          }
          if (index === listItems.length - 1) {
            leftStyle = {
              borderTopLeftRadius: '0px',
              borderBottomLeftRadius: '5px'
            }
            rightStyle = {
              borderTopRightRadius: '0px',
              borderBottomRightRadius: '5px',
              borderTopLeftRadius: '0px',
              borderBottomLeftRadius: '0px'
            }
          }
          if (index === 0 && listItems.length === 1) {
            leftStyle = {
              borderTopLeftRadius: '5px',
              borderBottomLeftRadius: '5px'
            }
            rightStyle = {
              borderTopRightRadius: '5px',
              borderBottomRightRadius: '5px',
              borderBottomLeftRadius: '0px'
            }
          }
          return (
            <div
              className="input-group"
              key={index}
            >
              <label
                className="input-group-addon"
                style={leftStyle}
              >
                <input
                  type={inputType}
                  checked={listItem.checked}
                  onChange={() => onSelect(index)}
                />
              </label>
              <div
                className="list-group-item check-list-item"
                style={rightStyle}
                onClick={() => onSelect(index)}
                dangerouslySetInnerHTML={{__html: listItem.label}}
              ></div>
            </div>
          )
        })}
      </form>
    </div>
  )
}
