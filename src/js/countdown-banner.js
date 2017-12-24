function CountdownBanner (id, opts) {
  this.id = id;
  this.countdownEnded = false;
  this.info = opts.info;

  //Before this date the banner will not be shown
  this.revealDate = opts.revealDate;

  //The start time of the event you're promoing. The first countdown counts down to this and says "Starts IN"
  this.startDate = opts.startDate;

  //The end time of the event you're promoing. After this time the banner will not be shown.
  this.endDate = opts.endDate;
  this.buttonLabel = opts.buttonLabel || 'Go';
  this.urls = opts.urls || {started: {}, notStarted: {}};

  if(opts.infoTemplate) {
    this.info = getTemplate(opts.infoTemplate);
  }

  this.start = function (callback) {
    var timeToReveal = this.revealDate.getTime() - new Date().getTime();

    //If it isn't time to display it just yet we don't show anything
    //and we check back more or less at the reveal date
    if(timeToReveal > 0) {
      setTimeout(function () {
        this.start(callback);
      }.bind(this), timeToReveal);
      return
    }

    this.bannerEl = document.getElementById('countdown-banner');
    this.countdown = this.bannerEl.querySelector('[role=countdown]');
    this.bannerEl.classList.toggle(this.id, true);
    this.render();
    if(typeof(callback) == 'function') {
      callback();
    }
  };

  this.render = function () {
    var now = new Date().getTime();
    var to;
    var started;
    if(now > this.startDate.getTime()) {
      started = true;
      if(now < this.endDate.getTime()) {
        to = this.endDate;
        ended = false;
        label = 'Ends In';
      }
      else {
        ended = true;
        return this.hideBanner();
      }
    }
    else {
      started = false;
      to = this.startDate;
      label = 'Starts In';
    }

    var urls = started ? this.urls.started : this.urls.notStarted;

    var scope = {
      to: to,
      label: label,
      buttonLabel: this.buttonLabel,
      started: started,
      ended: false,
      urlInfo: urls.info,
      urlButton: urls.button,
      info: this.info
    }

    render(this.bannerEl, getTemplate('countdown-banner'), scope);
    this.bannerEl.classList.toggle('show', true);
    startCountdownTicks(); //Always on for black friday
  }

  this.hideBanner = function () {
    this.bannerEl.style.display = 'none';
    this.bannerEl.innerHTML = '';
  }

  this.countdownEnd = function () {
    setTimeout(function () {
      this.render();
    }.bind(this), 1000);
  }
}