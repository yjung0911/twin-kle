import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {withRouter} from 'react-router-dom'
import SearchInput from 'components/Texts/SearchInput'
import {stringIsEmpty, cleanString} from 'helpers/stringHelpers'
import {loadVideoPageFromClientSideAsync} from 'redux/actions/VideoActions'
import {loadLinkPage} from 'redux/actions/LinkActions'
import {clearSearchResults, searchContent} from 'redux/actions/ContentActions'
import {Color} from 'constants/css'
import {recordUserAction} from 'helpers/userDataHelpers'

class SearchBox extends Component {
  static propTypes = {
    className: PropTypes.string,
    clearSearchResults: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    loadLinkPage: PropTypes.func.isRequired,
    loadVideoPage: PropTypes.func.isRequired,
    location: PropTypes.object.isRequired,
    loggedIn: PropTypes.bool,
    searchContent: PropTypes.func.isRequired,
    searchResult: PropTypes.array.isRequired,
    style: PropTypes.object
  }

  constructor() {
    super()
    this.state = {
      searchText: ''
    }
    this.onContentSearch = this.onContentSearch.bind(this)
    this.onSelect = this.onSelect.bind(this)
  }

  render() {
    const {searchResult, clearSearchResults, className, style} = this.props
    const {searchText} = this.state
    return (
      <form className={className} style={style}>
        <SearchInput
          placeholder="Search for Videos and Links"
          onChange={this.onContentSearch}
          value={searchText}
          searchResults={searchResult}
          renderItemLabel={
            item => <span>
              <span style={{
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                lineHeight: 'normal'
              }}>
                <span
                  style={{
                    color: item.type === 'video' ? Color.logoBlue : Color.pink,
                    fontWeight: 'bold'
                  }}
                >
                  [{item.type === 'video' ? 'Video' : 'Link'}]
                </span>&nbsp;&nbsp;&nbsp;<span>{cleanString(item.label)}</span>
              </span>
            </span>
          }
          onClickOutSide={() => {
            this.setState({searchText: ''})
            clearSearchResults()
          }}
          onSelect={this.onSelect}
        />
      </form>
    )
  }

  onContentSearch(text) {
    const {searchContent, clearSearchResults} = this.props
    this.setState({searchText: text})
    if (stringIsEmpty(text)) {
      return clearSearchResults()
    }
    searchContent(text)
  }

  onSelect(item) {
    const {
      clearSearchResults, loadVideoPage, loadLinkPage,
      history, loggedIn, location: {pathname}
    } = this.props
    this.setState({searchText: ''})
    clearSearchResults()
    if (loggedIn) recordUserAction({action: 'search', target: item.type, subTarget: item.id})
    if (pathname === `/${item.type}s/${item.id}`) return
    if (item.type === 'video') {
      return loadVideoPage(item.id).then(
        () => history.push(`/${item.type}s/${item.id}`)
      )
    } else {
      return loadLinkPage(item.id).then(
        () => history.push(`/${item.type}s/${item.id}`)
      )
    }
  }
}

export default connect(
  state => ({
    searchResult: state.ContentReducer.searchResult,
    loggedIn: state.UserReducer.loggedIn
  }),
  {
    searchContent,
    loadVideoPage: loadVideoPageFromClientSideAsync,
    loadLinkPage,
    clearSearchResults
  }
)(withRouter(SearchBox))
