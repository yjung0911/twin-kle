import React from 'react';
import ReactDOM from 'react-dom';
import tweenState from './tweenState';
import assign from 'object-assign';
import ExecutionEnvironment from 'exenv';
import ButtonGroup from 'components/ButtonGroup';
import NavButton from './NavButton';
import {connect} from 'react-redux';
import {
  getListStyles,
  getFrameStyles,
  getSliderStyles,
  getSlideStyles,
  getStyleTagStyles } from './styles';

import {
  formatChildren,
  setInitialDimensions,
  setDimensions,
  setExternalData } from './helpers';

import {
  onResize,
  onReadyStateChange } from './listeners';


const Carousel = React.createClass({
  mixins: [tweenState.Mixin],

  getDefaultProps() {
    return {
      afterSlide: function() { },
      beforeSlide: function() { },
      cellAlign: 'left',
      cellSpacing: 0,
      data: function() {},
      dragging: true,
      easing: 'easeOutCirc',
      edgeEasing: 'easeOutElastic',
      framePadding: '0px',
      slideIndex: 0,
      slidesToScroll: 1,
      slidesToShow: 1,
      slideWidth: 1,
      speed: 500,
      width: '100%'
    }
  },

  getInitialState() {
    return {
      currentSlide: this.props.slideIndex,
      dragging: false,
      frameWidth: 0,
      left: 0,
      slideCount: 0,
      slidesToScroll: this.props.slidesToScroll,
      slideWidth: 0,
      top: 0
    }
  },

  componentWillMount() {
    setInitialDimensions.bind(this)();
  },

  componentDidMount() {
    setDimensions.bind(this)();
    bindListeners.bind(this)();
    setExternalData.bind(this)();

    function bindListeners() {
      var self = this;
      if (ExecutionEnvironment.canUseDOM) {
        addEvent(window, 'resize', onResize.bind(self));
        addEvent(document, 'readystatechange', onReadyStateChange.bind(self));
      }

      function addEvent(elem, type, eventHandle) {
        if (elem === null || typeof (elem) === 'undefined') {
          return;
        }
        if (elem.addEventListener) {
          elem.addEventListener(type, eventHandle, false);
        } else if (elem.attachEvent) {
          elem.attachEvent('on' + type, eventHandle);
        } else {
          elem['on' + type] = eventHandle;
        }
      }
    }
  },

  componentWillReceiveProps(nextProps) {
    this.setState({
      slideCount: nextProps.children.length
    });

    if(nextProps.chatMode === this.props.chatMode) {
      setDimensions.bind(this)();
    }

    if (nextProps.slideIndex !== this.state.currentSlide) {
      this.goToSlide(nextProps.slideIndex);
    }
  },

  componentWillUnmount() {
    unbindListeners.bind(this)();

    function unbindListeners() {
      var self = this;
      if (ExecutionEnvironment.canUseDOM) {
        removeEvent(window, 'resize', onResize);
        removeEvent(document, 'readystatechange', onReadyStateChange);
      }

      function removeEvent(elem, type, eventHandle) {
        if (elem === null || typeof (elem) === 'undefined') {
          return;
        }
        if (elem.removeEventListener) {
          elem.removeEventListener(type, eventHandle, false);
        } else if (elem.detachEvent) {
          elem.detachEvent('on' + type, eventHandle);
        } else {
          elem['on' + type] = null;
        }
      };
    }
  },

  render() {
    var self = this;
    var children = React.Children.count(this.props.children) > 1 ? formatChildren.bind(this)(this.props.children) : this.props.children;
    const slideFraction = (this.state.currentSlide + 1)/this.state.slideCount;
    return (
      <div className={['slider', this.props.className || ''].join(' ')} ref="slider" style={assign(getSliderStyles.bind(this)(), this.props.style || {})}>
        { this.props.userIsUploader &&
          <a
            style={{
              position: 'absolute',
              cursor: 'pointer'
            }}
            onClick={ () => this.props.showQuestionsBuilder() }
          >Add/Edit Questions</a>
        }
        {this.props.progressBar &&
          <div>
            <div
              className="text-center"
            >
              <ButtonGroup
                buttons={[
                  {
                    label: 'Prev',
                    onClick: this.previousSlide,
                    buttonClass: 'btn-default',
                    disabled: this.state.currentSlide === 0
                  },
                  {
                    label: this.state.currentSlide + 1 === this.state.slideCount ? 'Finish' : 'Next',
                    onClick: this.state.currentSlide + 1 === this.state.slideCount ? this.props.onFinish : this.nextSlide,
                    buttonClass: 'btn-default',
                  }
                ]}
              />
            </div>
            <div
              className="progress"
              style={{marginTop: '2rem'}}
            >
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuenow="0"
                aria-valuemin="0"
                aria-valuemax="100"
                style={{width: `${slideFraction*100}%`}}
              >{`${this.state.currentSlide + 1}/${this.state.slideCount}`}</div>
            </div>
          </div>
        }
        <div className="slider-frame"
          ref="frame"
          style={getFrameStyles.bind(this)()}
          {...this.getTouchEvents()}
          {...this.getMouseEvents()}
          onClick={this.handleClick}>
          <ul className="slider-list" ref="list" style={getListStyles.bind(this)()}>
            {children}
          </ul>
        </div>
        {!this.props.progressBar &&
          [
            <NavButton
              left
              key={0}
              disabled={self.state.currentSlide === 0}
              nextSlide={self.previousSlide}
            />,
            <NavButton
              key={1}
              disabled={this.state.currentSlide + this.state.slidesToScroll >= this.state.slideCount}
              nextSlide={self.nextSlide}
            />
          ]
        }
        <style type="text/css" dangerouslySetInnerHTML={{__html: getStyleTagStyles.bind(self)()}}/>
      </div>
    )
  },

  // Touch Events

  touchObject: {},

  getTouchEvents() {
    var self = this;

    return {
      onTouchStart(e) {
        self.touchObject = {
          startX: e.touches[0].pageX,
          startY: e.touches[0].pageY
        }
      },
      onTouchMove(e) {
        var direction = self.swipeDirection(
          self.touchObject.startX,
          e.touches[0].pageX,
          self.touchObject.startY,
          e.touches[0].pageY
        );

        if (direction !== 0) {
          e.preventDefault();
        }

        var length = Math.round(Math.sqrt(Math.pow(e.touches[0].pageX - self.touchObject.startX, 2)))

        self.touchObject = {
          startX: self.touchObject.startX,
          startY: self.touchObject.startY,
          endX: e.touches[0].pageX,
          endY: e.touches[0].pageY,
          length: length,
          direction: direction
        }

        self.setState({
          left: self.getTargetLeft(self.touchObject.length * self.touchObject.direction),
          top: 0
        });
      },
      onTouchEnd(e) {
        self.handleSwipe(e);
      },
      onTouchCancel(e) {
        self.handleSwipe(e);
      }
    }
  },

  clickSafe: true,

  getMouseEvents() {
    var self = this;

    if (this.props.dragging === false) {
      return null;
    }

    return {
      onMouseDown(e) {
        self.touchObject = {
          startX: e.clientX,
          startY: e.clientY
        };

        self.setState({
          dragging: true
        });
      },
      onMouseMove(e) {
        if (!self.state.dragging) {
          return;
        }

        var direction = self.swipeDirection(
          self.touchObject.startX,
          e.clientX,
          self.touchObject.startY,
          e.clientY
        );

        if (direction !== 0) {
          e.preventDefault();
        }

        var length = Math.round(Math.sqrt(Math.pow(e.clientX - self.touchObject.startX, 2)))

        self.touchObject = {
          startX: self.touchObject.startX,
          startY: self.touchObject.startY,
          endX: e.clientX,
          endY: e.clientY,
          length: length,
          direction: direction
        };

        self.setState({
          left: self.getTargetLeft(self.touchObject.length * self.touchObject.direction),
          top: 0
        });
      },
      onMouseUp(e) {
        if (!self.state.dragging) {
          return;
        }

        self.handleSwipe(e);
      },
      onMouseLeave(e) {
        if (!self.state.dragging) {
          return;
        }

        self.handleSwipe(e);
      }
    }
  },

  handleClick(e) {
    if (this.clickSafe === true) {
      e.preventDefault();
      e.stopPropagation();

      if (e.nativeEvent) {
        e.nativeEvent.stopPropagation();
      }
    }
  },

  handleSwipe(e) {
    if (typeof (this.touchObject.length) !== 'undefined' && this.touchObject.length > 44) {
      this.clickSafe = true;
    } else {
      this.clickSafe = false;
    }

    if (this.touchObject.length > (this.state.slideWidth / this.props.slidesToShow) / 5) {
      if (this.touchObject.direction === 1) {
        if (this.state.currentSlide >= React.Children.count(this.props.children) - this.props.slidesToShow) {
          this.animateSlide(tweenState.easingTypes[this.props.edgeEasing]);
        } else {
          this.nextSlide();
        }
      } else if (this.touchObject.direction === -1) {
        if (this.state.currentSlide <= 0) {
          this.animateSlide(tweenState.easingTypes[this.props.edgeEasing]);
        } else {
          this.previousSlide();
        }
      }
    } else {
      this.goToSlide(this.state.currentSlide);
    }

    this.touchObject = {};

    this.setState({
      dragging: false
    });
  },

  swipeDirection(x1, x2, y1, y2) {

    var xDist, yDist, r, swipeAngle;

    xDist = x1 - x2;
    yDist = y1 - y2;
    r = Math.atan2(yDist, xDist);

    swipeAngle = Math.round(r * 180 / Math.PI);
    if (swipeAngle < 0) {
      swipeAngle = 360 - Math.abs(swipeAngle);
    }
    if ((swipeAngle <= 45) && (swipeAngle >= 0)) {
      return 1;
    }
    if ((swipeAngle <= 360) && (swipeAngle >= 315)) {
      return 1;
    }
    if ((swipeAngle >= 135) && (swipeAngle <= 225)) {
      return -1;
    }
    return 0;

  },

  // Action Methods

  goToSlide(index) {
    var self = this;
    if (index >= React.Children.count(this.props.children) || index < 0) {
      return;
    }

    this.props.beforeSlide(this.state.currentSlide, index);

    this.setState({
      currentSlide: index
    }, function() {
      self.animateSlide();
      this.props.afterSlide(index);
      setExternalData.bind(this)();
    });
  },

  nextSlide() {
    var childrenCount = React.Children.count(this.props.children);
    if (this.state.currentSlide >= childrenCount - this.props.slidesToShow) {
      return;
    }

    this.goToSlide(Math.min(this.state.currentSlide + this.state.slidesToScroll, childrenCount - this.props.slidesToShow));
  },

  previousSlide() {
    if (this.state.currentSlide <= 0) {
      return;
    }

    this.goToSlide(Math.max(0, this.state.currentSlide - this.state.slidesToScroll));
  },

  // Animation

  animateSlide(easing, duration, endValue) {
    this.tweenState('left', {
      easing: easing || tweenState.easingTypes[this.props.easing],
      duration: duration || this.props.speed,
      endValue: endValue || this.getTargetLeft()
    });
  },

  getTargetLeft(touchOffset) {
    var offset;
    switch (this.props.cellAlign) {
    case 'left': {
      offset = 0;
      offset -= this.props.cellSpacing * (this.state.currentSlide);
      break;
    }
    case 'center': {
      offset = (this.state.frameWidth - this.state.slideWidth) / 2;
      offset -= this.props.cellSpacing * (this.state.currentSlide);
      break;
    }
    case 'right': {
      offset = this.state.frameWidth - this.state.slideWidth;
      offset -= this.props.cellSpacing * (this.state.currentSlide);
      break;
    }
    }

    offset -= touchOffset || 0;

    return ((this.state.slideWidth * this.state.currentSlide) - offset) * -1;
  }
});

Carousel.ControllerMixin = {
  getInitialState() {
    return {
      carousels: {}
    }
  },
  setCarouselData(carousel) {
    var data = this.state.carousels;
    data[carousel] = this.refs[carousel];
    this.setState({
      carousels: data
    });
  }
}

export default connect(
  state => ({
    chatMode: state.ChatReducer.chatMode
  })
)(Carousel)