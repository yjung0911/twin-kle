import PropTypes from 'prop-types'
import React, {Component} from 'react'
import onClickOutside from 'react-onclickoutside'
import {cleanString, addEmoji, finalizeEmoji, trimWhiteSpaces} from 'helpers/stringHelpers'
import SearchDropdown from 'components/SearchDropdown'
import Button from 'components/Button'
import {Color} from 'constants/css'
import {timeSince} from 'helpers/timeStampHelpers'
import SubjectsModal from '../../Modals/SubjectsModal'
import Input from 'components/Texts/Input'
import {edit} from 'constants/placeholders'

class EditSubjectForm extends Component {
  static propTypes = {
    autoFocus: PropTypes.bool,
    currentSubjectId: PropTypes.number,
    maxLength: PropTypes.number,
    onChange: PropTypes.func.isRequired,
    onClickOutSide: PropTypes.func.isRequired,
    onEditSubmit: PropTypes.func.isRequired,
    reloadChatSubject: PropTypes.func,
    searchResults: PropTypes.array,
    style: PropTypes.object,
    title: PropTypes.string.isRequired
  }

  handleClickOutside = (event) => {
    const {subjectsModalShown} = this.state
    if (!subjectsModalShown) this.props.onClickOutSide()
  }

  constructor(props) {
    super()
    this.state = {
      title: cleanString(props.title),
      highlightedIndex: -1,
      subjectsModalShown: false
    }
    this.onEditSubmit = this.onEditSubmit.bind(this)
    this.onInputChange = this.onInputChange.bind(this)
    this.onItemClick = this.onItemClick.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onUpdate = this.onUpdate.bind(this)
    this.renderItemLabel = this.renderItemLabel.bind(this)
  }

  render() {
    const {title, highlightedIndex, subjectsModalShown} = this.state
    const {currentSubjectId, reloadChatSubject, style, autoFocus, maxLength = 100, searchResults} = this.props
    return (
      <div>
        {subjectsModalShown &&
          <SubjectsModal
            currentSubjectId={currentSubjectId}
            onHide={() => this.setState({subjectsModalShown: false})}
            selectSubject={subjectId => {
              reloadChatSubject(subjectId)
              this.setState({subjectsModalShown: false})
            }}
          />
        }
        <div className="col-xs-10" style={{paddingLeft: '0px', paddingRight: '0px'}}>
          <form onSubmit={event => this.onEditSubmit(event)}>
            <Input
              style={style}
              autoFocus={autoFocus}
              type="text"
              className="form-control"
              placeholder={edit.subject}
              value={title}
              onChange={this.onInputChange}
              onKeyUp={event => this.setState({title: addEmoji(event.target.value)})}
              onKeyDown={this.onKeyDown}
            />
            <small style={{color: title.length > maxLength && 'red'}}>{title.length}/{maxLength} Characters</small>
            {title.length <= maxLength &&
              <small> (Press <b>Enter</b> to Apply)</small>
            }
          </form>
          {searchResults.length > 0 &&
            <SearchDropdown
              onUpdate={this.onUpdate}
              onUnmount={() => this.setState({highlightedIndex: -1})}
              onItemClick={this.onItemClick}
              renderItemLabel={this.renderItemLabel}
              startingIndex={-1}
              indexToHighlight={highlightedIndex}
              searchResults={searchResults}
            />
          }
        </div>
        <div className="col-xs-2 col-offset-xs-10" style={{float: 'right', paddingRight: '0px'}}>
          <Button
            className="btn btn-success"
            style={{float: 'right', marginRight: '1em', width: '90%'}}
            onClick={() => this.setState({subjectsModalShown: true})}
          >
            View Subjects
          </Button>
        </div>
      </div>
    )
  }

  onKeyDown(event) {
    const {searchResults} = this.props
    const {highlightedIndex} = this.state
    let index = highlightedIndex
    if (searchResults.length > 0) {
      if (event.keyCode === 40) {
        event.preventDefault()
        this.setState({highlightedIndex: Math.min(++index, searchResults.length - 1)})
      }

      if (event.keyCode === 38) {
        event.preventDefault()
        this.setState({highlightedIndex: Math.max(--index, -1)})
      }
    }
  }

  onInputChange(text) {
    const {onChange} = this.props
    this.setState({title: text})
    return onChange(text).then(
      () => {
        const {searchResults} = this.props
        const {title} = this.state
        let text = title ? `${title[0].toUpperCase()}${title.slice(1)}` : ''
        let exactMatchExists = false
        let matchIndex
        for (let i = 0; i < searchResults.length; i++) {
          if (text === searchResults[i].content) {
            exactMatchExists = true
            matchIndex = i
            break
          }
        }
        this.setState({highlightedIndex: exactMatchExists ? matchIndex : -1})
      }
    )
  }

  onUpdate() {
    const {searchResults} = this.props
    const {title} = this.state
    let text = title ? `${title[0].toUpperCase()}${title.slice(1)}` : ''
    let exactMatchExists = false
    let matchIndex
    for (let i = 0; i < searchResults.length; i++) {
      if (text === searchResults[i].content) {
        exactMatchExists = true
        matchIndex = i
        break
      }
    }
    this.setState({
      highlightedIndex: exactMatchExists ? matchIndex : -1
    })
  }

  onEditSubmit(event) {
    const {
      onEditSubmit, onClickOutSide, maxLength = 100,
      reloadChatSubject, searchResults, currentSubjectId
    } = this.props
    const {title, highlightedIndex} = this.state
    event.preventDefault()
    if (highlightedIndex > -1) {
      const {id: subjectId} = searchResults[highlightedIndex]
      if (subjectId === currentSubjectId) return onClickOutSide()
      return reloadChatSubject(subjectId)
    }

    if (title && title.length > maxLength) return
    if (title && trimWhiteSpaces(`${title[0].toUpperCase()}${title.slice(1)}`) !== this.props.title) {
      onEditSubmit(finalizeEmoji(title))
    } else {
      onClickOutSide()
    }
  }

  onItemClick(item) {
    const {currentSubjectId, reloadChatSubject, onClickOutSide} = this.props
    const {id: subjectId} = item
    if (subjectId === currentSubjectId) return onClickOutSide()
    return reloadChatSubject(subjectId)
  }

  renderItemLabel(item) {
    return (
      <div>
        <div
          style={{
            color: Color.green,
            fontWeight: 'bold'
          }}
        >
          {cleanString(item.content)}<span style={{color: Color.blue}}>{(Number(item.numMsgs) > 0) && ` (${item.numMsgs})`}</span>
        </div>
        <div><small>Posted by <b>{item.username}</b> ({timeSince(item.timeStamp)})</small></div>
      </div>
    )
  }
}

export default onClickOutside(EditSubjectForm)
