function SiteNotice (args) {
  this.template = '';
  this.hideForDays = 7;
  for(var k in args) {
    this[k] = args[k];
  }
}

SiteNotice.prototype.start = function () {
  var scope = {};
  if(!this.shouldOpen() || !this.cookieExpired()) {
    this.close();
    return
  }
  this.transform(function (err, result) {
    scope = result;
    this.render(scope);
  }.bind(this))
}

SiteNotice.prototype.getCookieName = function () {
  return 'hide_notice_' + this.name;
}

SiteNotice.prototype.cookieExpired = function () {
  var iso = getCookie(this.getCookieName());
  if(!iso || !iso.length) {
    return true
  }

  var expired = new Date(iso).getTime() < new Date().getTime();
  return expired;
}

SiteNotice.prototype.render = function (scope) {
  var noticeEl = document.querySelector('#site-notice');
  render(noticeEl, getTemplateEl(this.template).textContent, scope);
  noticeEl.classList.toggle('hide', false);
  var height = noticeEl.getBoundingClientRect().height
  document.body.classList.toggle('showing-notice', true);
  if(this.completed) {
    this.completed();
  }
}

SiteNotice.prototype.close = function () {
  document.body.classList.toggle('showing-notice', true);
  var noticeEl = document.querySelector('#site-notice');
  noticeEl.classList.toggle('hide', true);
}

//When a user closes it instead of our code
//This also sets a cookie to hide the notice for a time
SiteNotice.prototype.closeByUser = function () {
  this.close();
  var hideUntil = new Date(new Date().getTime() + (this.hideForDays * 24 * 60 * 60 * 1000));
  setCookie(this.getCookieName(), hideUntil.toISOString());
}

SiteNotice.prototype.expireCookie = function () {
  setCookie(this.getCookieName(), new Date().toISOString());
}

/*========================================
=            COMPLETE PROFILE            =
========================================*/

var completeProfileNotice = new SiteNotice({
  hideForDays: 0, //TODO: Set to number of days to hide
  name: 'complete-profile',
  template: 'notice-complete-profile',
  transform: function (done) {
    var obj = {};
    obj.sections = {
      birthday: !session.user.birthday,
      emails: !session.user.emailOptIns || session.user.emailOptIns.length < 3,
      location: !session.user.geoLocation
    }
    done(null, obj);
  },
  shouldOpen: function () {
    return isSignedIn() && !hasCompletedProfile()
  },
  completed: function () {
    initLocationAutoComplete()
  }
});

function closeCompleteProfileNotice (e) {
  completeProfileNotice.closeByUser();
}

function submitCompleteProfile (e) {
  e.preventDefault();
  var form = e.target;
  var data = getDataSet(document.querySelector("[role=complete-profile-form]"), true, true);
  data = transformSubmittedAccountData(data);
  var exclude = {
    birthday: !!session.user.birthday,
    location: !!session.user.geoLocation
  }
  var errors = validateAccountData(data, exclude);
  if(errors.length) {
    errors.forEach(function (er) {
      toasty(new Error(er));
    });
    return
  }

  if(session.user.birthday) {
    delete data.birthday
  }

  update('self', null, data, function (err, obj) {
    if (err) return toasty(new Error(err.message));
    toasty('Profile complete, thank you!')
    completeProfileNotice.close();
    renderHeader()
    renderHeaderMobile()
  })
}