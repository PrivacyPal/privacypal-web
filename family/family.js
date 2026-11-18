/* PrivacyPal for families: content behaviors for the /family/ pages.
   Every /family/ page also loads assets/v3.js, which injects the shared
   announcement bar, nav, footer and modals into #site-nav-slot and
   #site-footer-slot (family/founding/ is the one exception: it keeps its
   own minimal header and loads only this file). This file adds the Family
   content behaviors: reveal on scroll, plus the burger for the legacy
   .fnav header, which no page uses today. */
(function(){
  'use strict';

  /* Mobile nav */
  var burger = document.querySelector('.fnav-burger');
  var links = document.querySelector('.fnav-links');
  if (burger && links){
    burger.addEventListener('click', function(){
      links.classList.toggle('open');
      burger.setAttribute('aria-expanded', links.classList.contains('open') ? 'true' : 'false');
    });
    links.addEventListener('click', function(e){
      if (e.target.tagName === 'A') links.classList.remove('open');
    });
  }

  /* Reveal on scroll */
  var revealed = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    revealed.forEach(function(el){ io.observe(el); });
  } else {
    revealed.forEach(function(el){ el.classList.add('in'); });
  }

})();
