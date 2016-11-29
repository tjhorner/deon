var releaseButtonsABCTest = new SplitTest({
  getButtons: function () {
    var buttons = document.querySelectorAll('.details-box .options a, .details-box .options button')
    return buttons
  },
  name: 'release-buttons-abc',
  modifiers: {
    'control': function () {
    },
    'button--cta': function (_this) {
      var buttons = _this.getButtons()
      for(var i = 0; i < buttons.length; i++) {
        buttons[i].classList.add('button', 'button--release-cta', 'button--cta')
        buttons[i].classList.remove('faux')
      }
    },
    'button--white': function (_this) {
      var buttons = _this.getButtons()
      for(var i = 0; i < buttons.length; i++) {
        if(i == 0) {
          buttons[i].classList.add('button', 'button--release-cta', 'button--cta')
        }
        else {
          buttons[i].classList.add('button', 'button--release-cta', 'button--white')
        }
        buttons[i].classList.remove('faux')
      }
    }
  },
  checkStart: function (test) {
    if(sixPackSession && this.getButtons().length > 0) {
      var early = document.querySelector('[name=inEarlyAccess]').value
      return early == "false"
    }
    return false
  },
  onStarted: function () {
    var buttons = this.getButtons()
    for(var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (e, el) {
        var kpi = false
        for(var i = 0; i < e.path.length; i++) {
          if(e.path[i].getAttribute('kpi')) {
            kpi = e.path[i].getAttribute('kpi')
            break;
          }
        }
        if(kpi) {
          splitTestConvertKpi(this.name, kpi)
        }
      }.bind(this))
    }    
  }
})

var musicReleasesVsBrowseTest = new SplitTest({
  name: 'music-releases-vs-browse',
  getNavItem: function () {
    return document.querySelector('nav.mcat-nav a[role=goto-music]')
  },
  recordPlays: false,
  checkStart: function () {
    return sixPackSession != null
  },
  onStarted: function () {
    this.getNavItem().addEventListener('click', function () {
      //If they click on the Music nav item we will count a conversion if they play music from there
      this.recordPlays = true
      splitTestConvertKpi('music-releases-vs-browse', 'music-clicked')
    }.bind(this))
    openRoute.completed.push(function () {
      //If they navigate away from the relevant pages then we don't record plays anymore, because they
      //aren't about plays after clicking Music
      var checkAgainst = window.location.pathname.substr(1)
      var goodUrls = []
      if(this.alt == 'releases') {
        goodUrls.push(/^(:?(\?.*)?$|music(\?.*)?)/) //the releases page
        goodUrls.push(/^release\/(.*)/) //a release page
      }
      else if(this.alt == 'browse') {
        goodUrls.push(/^release\/(.*)/) //a release page
        goodUrls.push(/^browse/)
      }

      var matched = false
      for(var i = 0; i < goodUrls.length; i++) {
        if(!checkAgainst.match(goodUrls[i])) {
          matched = true
        }
      }

      if(!matched) {
        this.recordPlays = false
      }
    }.bind(this))
  },
  modifiers: {
    'releases': function (_this) {
      _this.getNavItem().setAttribute('href', '/music')
    },
    'browse' : function (_this) {
      _this.getNavItem().setAttribute('href', '/browse')
    }
  }
})
