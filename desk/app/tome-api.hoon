::  Tome DB - a Holium collaboration
::  by ~larryx-woldyr
::  see https://tomedb.gitbook.io/tomedb/ for docs
::   
/-  *tome, s-p=spaces-path
/+  r-l=realm-lib
/+  verb, dbug, defa=default-agent
/+  *mip
::
|%
::
+$  versioned-state  $%(state-0)
::
+$  state-0  [%0 tome=(mip path:s-p app tome-data) subs=(set path)] :: subs is data paths we are subscribed to
::
+$  card  card:agent:gall
--
::
%+  verb  &
%-  agent:dbug
=|  state-0
=*  state  -
::
^-  agent:gall
::
=<
  |_  =bowl:gall
  +*  this  .
      def  ~(. (defa this %|) bowl)
      eng   ~(. +> [bowl ~])
  ++  on-init
    ^-  (quip card _this)
    ~>  %bout.[0 '%tome-api +on-init']
    =^  cards  state
      abet:init:eng
    [cards this]
  ::
  ++  on-save
    ^-  vase
    ~>  %bout.[0 '%tome-api +on-save']
    !>(state)
  ::
  ++  on-load
    |=  ole=vase
    ~>  %bout.[0 '%tome-api +on-load']
    ^-  (quip card _this)
    =^  cards  state
      abet:(load:eng ole)
    [cards this]
  ::
  ++  on-poke
    |=  cag=cage
    ~>  %bout.[0 '%tome-api +on-poke']
    ^-  (quip card _this)
    =^  cards  state  abet:(poke:eng cag)
    [cards this]
  ::
  ++  on-peek
    |=  =path
    ~>  %bout.[0 '%tome-api +on-peek']
    ^-  (unit (unit cage))
    (peek:eng path)
  ::
  ++  on-agent
    |=  [pol=(pole knot) sig=sign:agent:gall]
    ~>  %bout.[0 '%tome-api +on-agent']
    ^-  (quip card _this)
    =^  cards  state  abet:(dude:eng pol sig)
    [cards this]
  ::
  ++  on-arvo
    |=  [wir=wire sig=sign-arvo]
    ~>  %bout.[0 '%tome-api +on-arvo']
    ^-  (quip card _this)
    `this
  ::
  ++  on-watch
  |=  =path
  ~>  %bout.[0 '%tome-api +on-watch']
  ^-  (quip card _this)
  =^  cards  state  abet:(watch:eng path)
  [cards this]
  ::
  ++  on-fail
    ~>  %bout.[0 '%tome-api +on-fail']
    on-fail:def
  ::
  ++  on-leave
    ~>  %bout.[0 '%tome-api +on-leave']
    on-leave:def
  --
|_  [bol=bowl:gall dek=(list card)]
+*  dat  .
++  emit  |=(=card dat(dek [card dek]))
++  emil  |=(lac=(list card) dat(dek (welp lac dek)))
++  abet
  ^-  (quip card _state)
  [(flop dek) state]
::
++  init
  ^+  dat
  dat
::
++  load
  |=  vaz=vase
  ^+  dat
  ?>  ?=([%0 *] q.vaz)
  dat(state !<(state-0 vaz))
::  +watch: handle on-watch
::
++  watch
  |=  pol=(pole knot)
  ^+  dat
  ?+    pol  ~|(bad-watch-path/pol !!)
      [%kv ship=@ space=@ app=@ bucket=@ rest=*]
    =/  ship  `@p`(slav %p ship.pol)
    =^  cards  state
      kv-abet:(kv-watch:(kv-abed:kv [ship space.pol app.pol bucket.pol]) rest.pol)
    (emil cards)
  ::
      [%feed ship=@ space=@ app=@ bucket=@ log=@ rest=*]
    =/  ship    `@p`(slav %p ship.pol)
    =/  log=?   =(log.pol 'log')
    =^  cards  state
      fe-abet:(fe-watch:(fe-abed:fe [ship space.pol app.pol bucket.pol log]) rest.pol)
    (emil cards)
  ==
::  +dude: handle on-agent
::
++  dude
  |=  [pol=(pole knot) sig=sign:agent:gall]
  ^+  dat
  =^  cards  state
    ?+    pol  ~|(bad-dude-wire/pol !!)
        [%kv ship=@ space=@ app=@ bucket=@ rest=*]
      ::
      =/  ship  `@p`(slav %p ship.pol)
      ?+  -.sig  `state
        %fact  kv-abet:(kv-dude:(kv-abed:kv [ship space.pol app.pol bucket.pol]) cage.sig)
      ::
          %kick
        =.  subs  (~(del in subs) pol)
        kv-abet:(kv-view:(kv-abed:kv [ship space.pol app.pol bucket.pol]) rest.pol)
      ::
          %watch-ack
        ?+    rest.pol  ~|(bad-kv-watch-ack-path/rest.pol !!)
            [%data %all ~]
          ?~  p.sig
            ::  sub success, store that we're subscribed
            =.  subs  (~(put in subs) pol)
            `state
          ((slog leaf/"kv-watch nack" ~) `state)          
        ::
            [%perm ~]
          %.  `state
          ?~(p.sig same (slog leaf/"kv-watch nack" ~))
        ::
        ==
      ::
      ==
        [%feed ship=@ space=@ app=@ bucket=@ log=@ rest=*]
      ::
      =/  ship    `@p`(slav %p ship.pol)
      =/  log=?   =(log.pol 'log')
      ?+  -.sig  `state
        %fact  fe-abet:(fe-dude:(fe-abed:fe [ship space.pol app.pol bucket.pol log]) cage.sig)
      ::
          %kick
        =.  subs  (~(del in subs) pol)
        fe-abet:(fe-view:(fe-abed:fe [ship space.pol app.pol bucket.pol log]) rest.pol)
      ::
          %watch-ack
        ?+    rest.pol  ~|(bad-feed-watch-ack-path/rest.pol !!)
            [%data %all ~]
          ?~  p.sig
            =.  subs  (~(put in subs) pol)
            `state
          ((slog leaf/"feed-watch nack" ~) `state)          
        ::
            [%perm ~]
          %.  `state
          ?~(p.sig same (slog leaf/"feed-watch nack" ~))
        ::
        ==
      ==
    ::
    ==
  (emil cards)
::  +poke: handle on-poke
::
++  poke
  |=  [mar=mark vaz=vase]
  ^+  dat
  =^  cards  state
    ?+    mar  ~|(bad-tome-mark/mar !!)
        %tome-action
      =/  act     !<(tome-action vaz)
      =/  ship    `@p`(slav %p ship.act)
      ?-    -.act
          %init-tome
        ?.  =(our.bol src.bol)  ~|('no-foreign-init-tome' !!)
        ?:  (~(has bi tome) [ship space.act] app.act)
          `state
        `state(tome (~(put bi tome) [ship space.act] app.act *tome-data))
      ::
      ::  the following init pokes expect an %init-tome to already have been done.
          %init-kv
        ?.  =(our.bol src.bol)  ~|('no-foreign-init-kv' !!)
        =+  tod=(~(got bi tome) [ship space.act] app.act)
        ?:  (~(has by store.tod) bucket.act)
          `state
        =.  store.tod  (~(put by store.tod) bucket.act [perm.act *invited *kv-meta *kv-data])
        `state(tome (~(put bi tome) [ship space.act] app.act tod))
      ::
          %init-feed
        ?.  =(our.bol src.bol)  ~|('no-foreign-init-feed' !!)
        =+  tod=(~(got bi tome) [ship space.act] app.act)
        ?:  (~(has by feed.tod) [bucket.act log.act])
          `state
        =.  feed.tod  (~(put by feed.tod) [bucket.act log.act] [perm.act *feed-ids *invited *feed-data])
        `state(tome (~(put bi tome) [ship space.act] app.act tod))
      ::
      ==
    ::
        %kv-action
      =/  act   !<(kv-action vaz)
      =/  ship  `@p`(slav %p ship.act)
      =*  do    kv-abet:(kv-poke:(kv-abed:kv [ship space.act app.act bucket.act]) act)
      ?-  -.act
        %set-value     do
        %remove-value  do
        %clear-kv      do
        %verify-kv     do
          %perm-kv
        ?.  =(our.bol ship)  ~|('no-perm-foreign-kv' !!)
        do
          %invite-kv
        ?.  =(our.bol ship)  ~|('no-invite-foreign-kv' !!)
        do
          %team-kv
        ?:  =(our.bol ship)  ~|('no-team-local-kv' !!)
        kv-abet:(kv-view:(kv-abed:kv [ship space.act app.act bucket.act]) [%perm ~])
          %watch-kv
        ?:  =(our.bol ship)  ~|('no-watch-local-kv' !!)
        kv-abet:(kv-view:(kv-abed:kv [ship space.act app.act bucket.act]) [%data %all ~])
      ==
    ::
        %feed-action
      =/  act   !<(feed-action vaz)
      =/  ship  `@p`(slav %p ship.act)
      =*  do    fe-abet:(fe-poke:(fe-abed:fe [ship space.act app.act bucket.act log.act]) act)
      ?-    -.act
        %new-post          do
        %delete-post       do
        %edit-post         do
        %clear-feed        do
        %verify-feed       do
        %set-post-link     do
        %remove-post-link  do
          %perm-feed
        ?.  =(our.bol ship)  ~|('no-perm-foreign-feed' !!)
        do
          %invite-feed
        ?.  =(our.bol ship)  ~|('no-invite-foreign-feed' !!)
        do
          %team-feed
        ?:  =(our.bol ship)  ~|('no-team-local-feed' !!)
        fe-abet:(fe-view:(fe-abed:fe [ship space.act app.act bucket.act log.act]) [%perm ~])
          %watch-feed
        ?:  =(our.bol ship)  ~|('no-watch-local-feed' !!)
        fe-abet:(fe-view:(fe-abed:fe [ship space.act app.act bucket.act log.act]) [%data %all ~])
      ==
    ==
  (emil cards)
::  +peek: handle on-peek
::
++  peek
  |=  pol=(pole knot)
  ^-  (unit (unit cage))
  ?+    pol  ~|(bad-tome-peek-path/pol !!)
      [%x %kv ship=@ space=@ app=@ bucket=@ rest=*]
    =/  ship  `@p`(slav %p ship.pol)
    (kv-peek:(kv-abed:kv [ship space.pol app.pol bucket.pol]) rest.pol)
  ::
      [%x %feed ship=@ space=@ app=@ bucket=@ log=@ rest=*]
    =/  ship  `@p`(slav %p ship.pol)
    =/  log=?   =(log.pol 'log')
    (fe-peek:(fe-abed:fe [ship space.pol app.pol bucket.pol log]) rest.pol)
  ::
  ==
::
::  +kv: keyvalue engine
::
++  kv
  |_  $:  shi=ship
          spa=space
          =app
          buc=bucket
          tod=tome-data
          per=perm
          inv=invited
          meta=kv-meta
          data=kv-data
          caz=(list card)
          data-pax=path
          perm-pax=path
      ==
  +*  kv  .
  ++  kv-emit  |=(c=card kv(caz [c caz]))
  ++  kv-emil  |=(lc=(list card) kv(caz (welp lc caz)))
  ++  kv-abet
    ^-  (quip card _state)
    =.  store.tod  (~(put by store.tod) buc [per inv meta data])
    [(flop caz) state(tome (~(put bi tome) [shi spa] app tod))]
  ::  +kv-abed: initialize nested core.  only works when the map entries already exist
  ::
  ++  kv-abed
    |=  [p=ship s=space a=^app b=bucket]
    =/  tod       (~(got bi tome) [p s] a)
    =/  sto       (~(got by store.tod) b)
    =/  pp        `@tas`(scot %p p)
    =/  data-pax  /kv/[pp]/[s]/[a]/[b]/data/all
    =/  perm-pax  /kv/[pp]/[s]/[a]/[b]/perm
    %=  kv
      shi       p
      spa       s
      app       a
      buc       b
      tod       tod
      per       perm.sto
      inv       invites.sto
      meta      meta.sto
      data      data.sto
      data-pax  data-pax
      perm-pax  perm-pax
    ==
  ::  +kv-dude: handle foreign kv updates (facts)
  ::
  ++  kv-dude
    |=  cag=cage
    ^+  kv
    ?<  =(our.bol shi)
    ?+    p.cag  ~|('bad-kv-dude' !!)
        %kv-update
      =/  upd       !<(kv-update q.cag)
      ?+    -.upd   ~|('bad-kv-update' !!)
          %set
        %=  kv
          data  (~(put by data) key.upd s+value.upd)
          caz   [[%give %fact ~[data-pax] %kv-update !>(upd)] caz]
        ==
      ::
          %remove
        %=  kv
          data  (~(del by data) key.upd)
          caz   [[%give %fact ~[data-pax] %kv-update !>(upd)] caz]
        ==
      ::
          %clear
        %=  kv
          data  *kv-data
          caz   [[%give %fact ~[data-pax] %kv-update !>(upd)] caz]
        ==
      ::
          %all
        %=  kv
          data  data.upd
          caz   [[%give %fact ~[data-pax] %kv-update !>(upd)] caz]
        ==
      ::
          %perm
        =/  lc  :~  [%give %fact ~[perm-pax] %kv-update !>(upd)]
                    [%pass perm-pax %agent [shi %tome-api] %leave ~]
                ==
        %=  kv
          per   [read=%yes +.upd]
          caz   (welp lc caz)
        ==
      ::
      ==
    ==
  ::  +kv-watch: handle incoming kv watch requests
  ::
  ++  kv-watch
    |=  rest=(pole knot)
    ^+  kv
    ?>  (kv-perm %read)
    ?+    rest  ~|(bad-kv-watch-path/rest !!)
        [%perm ~]
      %-  kv-emit
      [%give %fact ~ %kv-update !>(`kv-update`kv-team)]
    ::
        [%data %all ~]
      %-  kv-emit
      [%give %fact ~ %kv-update !>(`kv-update`[%all data])]
    ::
    ==
  ::  +kv-poke: handle kv poke requests
  ::  cm = current metadata
  ::  nm = new metadata
  ::
  ++  kv-poke
    |=  act=kv-action
    ^+  kv
    ::  right now live updates only go to the subscribeAll endpoint
    ?+    -.act  ~|('bad-kv-action' !!)
        %set-value
      =+  cm=(~(gut by meta) key.act ~)
      =*  lvl
        ?~  cm
          %create
        ?:(=(src.bol created-by.cm) %create %overwrite)
      ?>  (kv-perm lvl)
      ::  equivalent value is already set, do nothing.
      ?:  =(s+value.act (~(gut by data) key.act ~))  kv
      ::
      =/  nm
        ?~  cm
          ::  this value is new, so create new metadata entry alongside it
          [src.bol src.bol now.bol now.bol]
        ::  this value already exists, so update its metadata
        [created-by.cm src.bol created-at.cm now.bol]
      ::
      %=  kv
        meta  (~(put by meta) key.act nm)
        data  (~(put by data) key.act s+value.act)
        caz   [[%give %fact ~[data-pax] %kv-update !>(`kv-update`[%set key.act value.act])] caz]
      ==
    ::
        %remove-value
      =+  cm=(~(gut by meta) key.act ~)
      =*  lvl
        ?~  cm
          %create
        ?:(=(src.bol created-by.cm) %create %overwrite)
      ?>  (kv-perm lvl)
      :: value doesn't exist, do nothing
      ?~  cm
        kv
      ::
      %=  kv
        meta  (~(del by meta) key.act)
        data  (~(del by data) key.act)
        caz   [[%give %fact ~[data-pax] %kv-update !>(`kv-update`[%remove key.act])] caz]
      ==
    ::
        %clear-kv
      ::  could check if all values are ours for %create perm level, but that's overkill
      ?>  (kv-perm %overwrite)
      ?~  meta  kv  :: nothing to clear
      %=  kv
        meta  *kv-meta
        data  *kv-data
        caz   [[%give %fact ~[data-pax] %kv-update !>(`kv-update`[%clear ~])] caz]
      ==
    ::
        %verify-kv
      :: The bucket must exist to get this far, so we just need to verify read permissions.
      ?>  (kv-perm %read)
      kv
    ::
        %perm-kv
      :: force everyone to re-subscribe
      kv(per perm.act, caz [[%give %kick ~[data-pax] ~] caz])
    ::
        %invite-kv
      =/  guy  `@p`(slav %p guy.act)
      %=  kv
        inv  (~(put by inv) guy level.act)
        caz  [[%give %kick ~[data-pax] `guy] caz]
      ==
    ::
    ==
  ::  +kv-peek: handle kv peek requests
  ::
  ++  kv-peek
    |=  rest=(pole knot)
    ^-  (unit (unit cage))
    ::  no perms check since no remote scry
    ?+    rest  ~|(bad-kv-peek-path/rest !!)
        [%data %all ~]
      ``kv-update+!>(`kv-update`[%all data])
    ::
        [%data %key key=@t ~]
      ``kv-update+!>(`kv-update`[%get (~(gut by data) key.rest ~)])
    ::
    ==
  ::  +kv-view: start watching foreign kv (permissions or path)
  ::
  ++  kv-view
    |=  rest=(pole knot)
    ^+  kv
    ?+    rest  ~|(bad-kv-watch-path/rest !!)
        [%perm ~]
      (kv-emit [%pass perm-pax %agent [shi %tome-api] %watch perm-pax])
    ::
        [%data %all ~]
      ?:  (~(has in subs) data-pax)  kv
      (kv-emit [%pass data-pax %agent [shi %tome-api] %watch data-pax])
    ::
    ==
  ::  +kv-perm: check a permission level, return true if allowed
  ::
  ++  kv-perm
    |=  [lvl=?(%read %create %overwrite)]
    ^-  ?
    ?:  =(src.bol our.bol)  %.y :: always allow local
    =/  bro  (~(gut by inv) src.bol ~)
    ?-    lvl
        %read
      ?~  bro
        ?-  read.per
          %unset    %.n
          %no       %.n
          %our      %.n :: it's not us, so no.
          %open     %.y
          %yes      %.y
            %space
          =/  memb  .^(view:m-s:r-l %gx /(scot %p our.bol)/spaces/(scot %da now.bol)/(scot %p shi)/[spa]/is-member/(scot %p our.bol)/noun)
          ?>  ?=(%is-member -.memb)
          is-member.memb
        ==
      :: use invite level to determine
      ?:(?=(%block bro) %.n %.y)
    ::
        %create
      ?~  bro
        ?-  write.per
          %unset    %.n
          %no       %.n
          %our      %.n
          %open     %.y
          %yes      %.y
            %space
          =/  memb  .^(view:m-s:r-l %gx /(scot %p our.bol)/spaces/(scot %da now.bol)/(scot %p shi)/[spa]/is-member/(scot %p our.bol)/noun)
          ?>  ?=(%is-member -.memb)
          is-member.memb
        ==
      ?:(?=(?(%block %read) bro) %.n %.y)
    ::
        %overwrite
      ?~  bro
        ?-  admin.per
          %unset    %.n
          %no       %.n
          %our      %.n
          %open     %.y
          %yes      %.y
            %space
          =/  memb  .^(view:m-s:r-l %gx /(scot %p our.bol)/spaces/(scot %da now.bol)/(scot %p shi)/[spa]/is-member/(scot %p our.bol)/noun)
          ?>  ?=(%is-member -.memb)
          is-member.memb
        ==
      ?:(?=(?(%block %read %write) bro) %.n %.y)
    ::
    ==
  ::  +kv-team: get write/admin permissions for a ship
  ::
  ++  kv-team
    =/  write   ?:((kv-perm %create) %yes %no)
    =/  admin   ?:((kv-perm %overwrite) %yes %no)
    [%perm write admin]
  ::
  --
::
::  +fe: feed engine
::
++  fe
  |_  $:  shi=ship
          spa=space
          ap=app
          buc=bucket
          lo=log
          tod=tome-data
          per=perm
          ids=feed-ids
          inv=invited
          data=feed-data
          caz=(list card)
          data-pax=path
          perm-pax=path
      ==
  +*  fe  .
  ++  fe-emit  |=(c=card fe(caz [c caz]))
  ++  fe-emil  |=(lc=(list card) fe(caz (welp lc caz)))
  ++  fe-abet
    ^-  (quip card _state)
    =.  feed.tod  (~(put by feed.tod) [buc lo] [per ids inv data])
    [(flop caz) state(tome (~(put bi tome) [shi spa] ap tod))]
  ::  +kv-abed: initialize nested core.  only works when the map entries already exist
  ::
  ++  fe-abed
    |=  [p=ship s=space a=app b=bucket l=log]
    =/  tod       (~(got bi tome) [p s] a)
    =/  fee       (~(got by feed.tod) [b l])
    =/  pp        `@tas`(scot %p p)
    =/  type      ?:(=(l %.y) %log %feed)
    %=  fe
      shi       p
      spa       s
      ap        a
      buc       b
      lo        l
      tod       tod
      per       perm.fee
      ids       ids.fee
      inv       invites.fee
      data      data.fee
      data-pax  /feed/[pp]/[s]/[a]/[b]/[type]/data/all
      perm-pax  /feed/[pp]/[s]/[a]/[b]/[type]/perm
    ==
  ::  +fe-dude: handle foreign feed updates (facts)
  ::
  ++  fe-dude
    |=  cag=cage
    ^+  fe
    ?<  =(our.bol shi)
    ?+    p.cag  ~|('bad-feed-dude' !!)
        %feed-update
      =/  upd  !<(feed-update q.cag)
      =/  fon  ((on time feed-value) gth)  :: mop needs this to work
      ?+    -.upd   ~|('bad-feed-update' !!)
          %new
        %=  fe
          ids   (~(put by ids) id.upd time.upd)
          data  (put:fon data time.upd [id.upd ship.upd ship.upd time.upd time.upd s+content.upd *links])
          caz   [[%give %fact ~[data-pax] %feed-update !>(upd)] caz]
        ==
      ::
          %edit
        =/  has  (~(has by ids) id.upd)
        =/  new-ids  :: add new ID if we don't have original
          ?:  has
            ids
          (~(put by ids) id.upd time.upd)
        ::
        =/  og-time  (~(got by ids) id.upd)
        ::
        =/  old-by
          ?:  has
            created-by:(got:fon data og-time)
          :: if we receive %edit without an original, just use them as the original author.
          ship.upd
        ::
        %=  fe
          ids   new-ids
          data  (put:fon data og-time [id.upd old-by ship.upd og-time time.upd s+content.upd *links])
          caz   [[%give %fact ~[data-pax] %feed-update !>(upd)] caz]
        ==
      ::
          %delete
        :: don't have it, ignore
        ?.  (~(has by ids) id.upd)  fe
        =/  res  (del:fon data time.upd)
        %=  fe
          ids   (~(del by ids) id.upd)
          data  +.res
          caz   [[%give %fact ~[data-pax] %feed-update !>(upd)] caz]
        ==
      ::
          %clear
        %=  fe
          ids   *feed-ids
          data  *feed-data
          caz   [[%give %fact ~[data-pax] %feed-update !>(upd)] caz]
        ==
      ::
          %set-link
        :: don't have the post, ignore
        ?.  (~(has by ids) id.upd)  fe
        =/  post   (got:fon data time.upd)
        =.  links.post  (~(put by links.post) ship.upd s+value.upd)
        %=  fe
          data  (put:fon data time.upd post)
          caz   [[%give %fact ~[data-pax] %feed-update !>(upd)] caz]
        ==
      ::
          %remove-link
        :: don't have the post, ignore
        ?.  (~(has by ids) id.upd)  fe
        =/  post   (got:fon data time.upd)
        :: don't have the link, ignore
        ?.  (~(has by links.post) ship.upd)  fe
        =.  links.post  (~(del by links.post) ship.upd)
        %=  fe
          data  (put:fon data time.upd post)
          caz   [[%give %fact ~[data-pax] %feed-update !>(upd)] caz]
        ==
      ::
          %all
        %=  fe
          ids   (malt (turn (tap:fon data.upd) |=([=time =feed-value] [id.feed-value time])))
          data  data.upd
          caz   [[%give %fact ~[data-pax] %feed-update !>(upd)] caz]
        ==
      ::
          %perm
        =/  lc  :~  [%give %fact ~[perm-pax] %feed-update !>(upd)]
                    [%pass perm-pax %agent [shi %tome-api] %leave ~]
                ==
        %=  fe
          per   [read=%yes +.upd]
          caz   (welp lc caz)
        ==
      ::
      ==
    ==

  ::  +fe-watch: handle incoming watch requests
  ::
  ++  fe-watch
    |=  rest=(pole knot)
    ^+  fe
    ?>  (fe-perm %read)
    ?+    rest  ~|(bad-feed-watch-path/rest !!)
        [%perm ~]
      %-  fe-emit
      [%give %fact ~ %feed-update !>(`feed-update`fe-team)]
    ::
        [%data %all ~]
      %-  fe-emit
      [%give %fact ~ %feed-update !>(`feed-update`[%all data])]
    ::
    ==
  ::  +fe-poke: handle log/feed pokes
  ::
  ++  fe-poke
    |=  act=feed-action
    ^+  fe
    =/  fon  ((on time feed-value) gth)  :: mop needs this to work
    ?+    -.act  ~|('bad-feed-action' !!)
        %new-post
      ?>  (fe-perm %create)
      ::
      %=  fe
        ids   (~(put by ids) id.act now.bol)
        data  (put:fon data now.bol [id.act src.bol src.bol now.bol now.bol s+content.act *links])
        caz   [[%give %fact ~[data-pax] %feed-update !>(`feed-update`[%new id.act now.bol src.bol content.act])] caz]
      ==
    ::
        %edit-post
      =+  time=(~(gut by ids) id.act ~)
      ?~  time
        ?>  (fe-perm ?:(=(lo %.y) %overwrite %create))
        ~|('no-post-to-edit' !!)
      ::
      =/  curr  (got:fon data time)
      =*  lvl   ?:(=(src.bol created-by.curr) ?:(=(lo %.y) %overwrite %create) %overwrite)
      ?>  (fe-perm lvl)
      ::
      %=  fe
        data  (put:fon data time [id.act created-by.curr src.bol created-at.curr now.bol s+content.act *links])
        caz   [[%give %fact ~[data-pax] %feed-update !>(`feed-update`[%edit id.act now.bol src.bol content.act])] caz]
      ==
    ::
        %delete-post
      =+  time=(~(gut by ids) id.act ~)
      ?~  time  :: if no post, do nothing
        ?>  (fe-perm ?:(=(lo %.y) %overwrite %create))
        fe
      ::
      =*  curr  (got:fon data time)
      =*  lvl   ?:(=(src.bol created-by.curr) ?:(=(lo %.y) %overwrite %create) %overwrite)
      ?>  (fe-perm lvl)
      ::
      =/  res  (del:fon data time)
      %=  fe
        ids   (~(del by ids) id.act)
        data  +.res  :: mop delete return type is weird. tail is the new map
        caz   [[%give %fact ~[data-pax] %feed-update !>(`feed-update`[%delete id.act time])] caz]
      ==
    ::
        %clear-feed
      ?>  (fe-perm %overwrite)
      ?~  ids  fe  :: if no posts, do nothing
      ::
      %=  fe
        ids  *feed-ids
        data  *feed-data
        caz   [[%give %fact ~[data-pax] %feed-update !>(`feed-update`[%clear ~])] caz]
      ==
    ::
        %verify-feed
      :: The bucket must exist to get this far, so we just need to verify read permissions.
      ?>  (fe-perm %read)
      fe
    ::
        %perm-feed
      :: force everyone to re-subscribe
      fe(per perm.act, caz [[%give %kick ~[data-pax] ~] caz])
    ::
        %invite-feed
      =/  guy  `@p`(slav %p guy.act)
      %=  fe
        inv  (~(put by inv) guy level.act)
        caz  [[%give %kick ~[data-pax] `guy] caz]
      ==
    ::
        %set-post-link  :: links are currently only supported by feeds, not logs
      ?>  =(lo %.n)
      ?>  (fe-perm %create)
      =+  time=(~(gut by ids) id.act ~)
      ?~  time  ~|('no-post-for-set-link' !!)
      ::
      =/  curr  (got:fon data time)
      =/  ship-str   `@t`(scot %p src.bol)
      =/  new-links  (~(put by links.curr) ship-str s+value.act)
      %=  fe
        data  (put:fon data time [id.act created-by.curr updated-by.curr created-at.curr updated-at.curr content.curr new-links])
        caz   [[%give %fact ~[data-pax] %feed-update !>(`feed-update`[%set-link id.act time ship-str value.act])] caz]
      ==
    ::
        %remove-post-link
      ?>  =(lo %.n)
      ?>  (fe-perm %create)
      =+  time=(~(gut by ids) id.act ~)
      ?~  time  :: if no post, do nothing.
        fe
      ::
      =/  curr  (got:fon data time)
      =/  ship-str   `@t`(scot %p src.bol)
      =/  new-links  (~(del by links.curr) ship-str)
      %=  fe
        data  (put:fon data time [id.act created-by.curr updated-by.curr created-at.curr updated-at.curr content.curr new-links])
        caz   [[%give %fact ~[data-pax] %feed-update !>(`feed-update`[%remove-link id.act time ship-str])] caz]
      ==
    ::
    ==
  ::  +fe-peek: handle kv peek requests
  ::
  ++  fe-peek
    |=  rest=(pole knot)
    ^-  (unit (unit cage))
    ::  no perms check since no remote scry
    ?+    rest  ~|(bad-feed-peek-path/rest !!)
        [%data %all ~]
      ``feed-update+!>(`feed-update`[%all data])
    ::
        [%data %key id=@t ~]
      =/  fon   ((on time feed-value) gth)
      =/  time  (~(gut by ids) id.rest ~)
      =/  post
        ?~  time  ~
        (got:fon data time)
      ::
      ``feed-update+!>(`feed-update`[%get post])
    ::
    ==
  ::  fe-view: start watching foreign feed
  ::
  ++  fe-view
    |=  rest=(pole knot)
    ^+  fe
    ?+    rest  ~|(bad-feed-watch-path/rest !!)
        [%perm ~]
      (fe-emit [%pass perm-pax %agent [shi %tome-api] %watch perm-pax])
    ::
        [%data %all ~]
      ?:  (~(has in subs) data-pax)  fe
      (fe-emit [%pass data-pax %agent [shi %tome-api] %watch data-pax])
    ::
    ==
  ::  +fe-perm: check a permission level, return true if allowed
  ::  duplicates +kv-perm
  ++  fe-perm
    |=  [lvl=?(%read %create %overwrite)]
    ^-  ?
    ?:  =(src.bol our.bol)  %.y :: always allow local
    =/  bro  (~(gut by inv) src.bol ~)
    ?-    lvl
        %read
      ?~  bro
        ?-  read.per
          %unset    %.n
          %no       %.n
          %our      %.n :: it's not us, so no.
          %open     %.y
          %yes      %.y
            %space
          =/  memb  .^(view:m-s:r-l %gx /(scot %p our.bol)/spaces/(scot %da now.bol)/(scot %p shi)/[spa]/is-member/(scot %p our.bol)/noun)
          ?>  ?=(%is-member -.memb)
          is-member.memb
        ==
      :: use invite level to determine
      ?:(?=(%block bro) %.n %.y)
    ::
        %create
      ?~  bro
        ?-  write.per
          %unset    %.n
          %no       %.n
          %our      %.n
          %open     %.y
          %yes      %.y
            %space
          =/  memb  .^(view:m-s:r-l %gx /(scot %p our.bol)/spaces/(scot %da now.bol)/(scot %p shi)/[spa]/is-member/(scot %p our.bol)/noun)
          ?>  ?=(%is-member -.memb)
          is-member.memb
        ==
      ?:(?=(?(%block %read) bro) %.n %.y)
    ::
        %overwrite
      ?~  bro
        ?-  admin.per
          %unset    %.n
          %no       %.n
          %our      %.n
          %open     %.y
          %yes      %.y
            %space
          =/  memb  .^(view:m-s:r-l %gx /(scot %p our.bol)/spaces/(scot %da now.bol)/(scot %p shi)/[spa]/is-member/(scot %p our.bol)/noun)
          ?>  ?=(%is-member -.memb)
          is-member.memb
        ==
      ?:(?=(?(%block %read %write) bro) %.n %.y)
    ::
    ==
  ::  +fe-team: get read/write/admin permissions for a ship
  ::
  ++  fe-team
    =/  write   ?:((fe-perm %create) %yes %no)
    =/  admin   ?:((fe-perm %overwrite) %yes %no)
    [%perm write admin]
  ::
  --
--