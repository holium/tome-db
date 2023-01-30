::  a space agent skeleton
/-  *tome, s-p=spaces-path
/+  r-l=realm-lib
/+  verb, dbug, defa=default-agent
/+  *mip
::
|%
::
+$  versioned-state  $%(state-0)
::
+$  state-0  [%0 tome=(mip path:s-p app tome-data) subs=(set path)]
::
::
::  boilerplate
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
    [~ ~]
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
  =^  cards  state  abet:(peer:eng path)
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
::  +peer: handle on-watch
::
++  peer
  |=  pol=(pole knot)
  ^+  dat
  ?+    pol  ~|(bad-watch-path/pol !!)
      [%kv ship=@ space=@ app=@ bucket=@ rest=*]
    =/  ship  `@p`(slav %p ship.pol)
    =^  cards  state
      kv-abet:(kv-peer:(kv-abed:kv [ship space.pol app.pol bucket.pol]) rest.pol)
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
      ::  local store should already have 
      =/  ship  `@p`(slav %p ship.pol)
      ?+  -.sig  `state
        %kick  kv-abet:(kv-view:(kv-abed:kv [ship space.pol app.pol bucket.pol]) rest.pol)
        %fact  kv-abet:(kv-dude:(kv-abed:kv [ship space.pol app.pol bucket.pol]) cage.sig)
      ::
          %watch-ack
        %.  `state
        ?~(p.sig same (slog leaf/"kv-data-all nack" ~))
      ==
    ::
    ==
  (emil cards)
::  +poke: handle on-poke
::
++  poke
  |=  [mar=mark vaz=vase]
  =^  cards  state
    ?+    mar  ~|(bad-tome-mark/mar !!)
        %tome-action
      =/  act     !<(tome-action vaz)
      =/  ship    `@p`(slav %p `@t`(cat 3 '~' ship.act))
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
        =.  store.tod  (~(put by store.tod) bucket.act [perm.act *invited *invited *kv-meta *kv-data])
        `state(tome (~(put bi tome) [ship space.act] app.act tod))
      ::
          %init-feed
        ?.  =(our.bol src.bol)  ~|('no-foreign-init-feed' !!)
        =+  tod=(~(got bi tome) [ship space.act] app.act)
        ?:  (~(has by feed.tod) [bucket.act log.act])
          `state
        =.  feed.tod  (~(put by feed.tod) [bucket.act log.act] [perm.act *feed-ids *invited *invited *feed-data])
        `state(tome (~(put bi tome) [ship space.act] app.act tod))
      ::
      ==
    ::
        %kv-action
      =/  act   !<(kv-action vaz)
      =/  ship  `@p`(slav %p `@t`(cat 3 '~' ship.act))
      =*  do    kv-abet:(kv-poke:(kv-abed:kv [ship space.act app.act bucket.act]) act)
      ?-  -.act
        %set-value     do
        %remove-value  do
        %clear-kv      do
        %verify-kv     do
        %team-kv       do
          %watch-kv
        ?:  =(our.bol ship)  ~|('no-watch-local-kv' !!)
        kv-abet:(kv-view:(kv-abed:kv [ship space.act app.act bucket.act]) [%data %all ~])
      ==
    ::
        %feed-action
      =/  act   !<(feed-action vaz)
      =/  ship  `@p`(slav %p `@t`(cat 3 '~' ship.act))
      =*  do    fe-abet:(fe-poke:(fe-abed:fe [ship space.act app.act bucket.act log.act]) act)
      :: ~&  >>>  act
      ?-    -.act
        %new-post          do
        %delete-post       do
        %edit-post         do
        %clear-feed        do
        %verify-feed       do
        %team-feed         do
        %set-post-link     do
        %remove-post-link  do
          %watch-feed
        ?:  =(our.bol ship)  ~|('no-watch-local-feed' !!)
        fe-abet:(fe-view:(fe-abed:fe [ship space.act app.act bucket.act log.act]) [%data %all ~])
      ==
    ==
  (emil cards)
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
          whi=invited
          bla=invited
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
    =.  store.tod  (~(put by store.tod) buc [per whi bla meta data])
    [(flop caz) state(tome (~(put bi tome) [shi spa] app tod))]
  ::  +kv-abed: initialize nested core.  only works when the map entries already exist
  ::
  ++  kv-abed
    |=  [p=ship s=space a=^app b=bucket]
    =/  tod       (~(got bi tome) [p s] a)
    =/  sto       (~(got by store.tod) b)
    =/  pp        `@tas`(scot %p p) :: planet for path
    =/  data-pax  /kv/[pp]/[s]/[a]/[b]/data/all
    =/  perm-pax  /kv/[pp]/[s]/[a]/[b]/perm
    %=  kv
      shi       p
      spa       s
      app       a
      buc       b
      tod       tod
      per       perm.sto
      whi       whitelist.sto
      bla       blacklist.sto
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
        %=  kv
          per   perm.upd
          caz   [[%give %fact ~[perm-pax] %kv-update !>(upd)] caz]
        ==
      ::
      ==
    ==
  ::  +kv-peer: handle incoming kv watch requests
  ::
  ++  kv-peer
    |=  rest=(pole knot)
    ^+  kv
    ?+    rest  ~|(bad-kv-watch-path/rest !!)
        [%perm ~]
      ~&  >  `kv-update`[%perm kv-team]
      %-  kv-emit
      [%give %fact ~ %kv-update !>(`kv-update`[%perm kv-team])]
        :: [%give %kick ~[perm-pax] `src.bol]
    ::
        [%data %all ~]
      %-  kv-emit
      [%give %fact ~ %kv-update !>(`kv-update`[%all data])]
    ::
        [%data %key k=@t ~]
      %-  kv-emil  :~
        [%give %fact ~ %kv-update !>(`kv-update`[%get (~(gut by data) k.rest ~)])]
        :: [%give %kick ~[data-pax] `src.bol]
      ==
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
      ::  equivalent value is already set, do nothing.
      ?:  =(s+value.act (~(gut by data) key.act ~))  kv
      =+  cm=(~(gut by meta) key.act ~)
      =*  lvl
        ?~  cm
          %create
        ?:(=(src.bol created-by.cm) %create %overwrite)
      ?>  ?:(=(src.bol our.bol) %.y (kv-perm lvl))
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
      ?~  cm
        kv
      =*  lvl  ?:(=(src.bol created-by.cm) %create %overwrite)
      ?>  ?:(=(src.bol our.bol) %.y (kv-perm lvl))
      ::
      %=  kv
        meta  (~(del by meta) key.act)
        data  (~(del by data) key.act)
        caz   [[%give %fact ~[data-pax] %kv-update !>(`kv-update`[%remove key.act])] caz]
      ==
    ::
        %clear-kv
      ?~  meta  kv  :: nothing to clear
      ::  could check if all values are ours for %create perm level, but that's overkill
      ?>  ?:(=(src.bol our.bol) %.y (kv-perm %overwrite))
      %=  kv
        meta  *kv-meta
        data  *kv-data
        caz   [[%give %fact ~[data-pax] %kv-update !>(`kv-update`[%clear ~])] caz]
      ==
    ::
        %verify-kv
      :: The bucket must exist to get this far, so we just need to verify read permissions.
      ?>  ?:(=(src.bol our.bol) %.y (kv-perm %read))
      kv
    ::
        %team-kv
      kv(caz [[%pass perm-pax %agent [shi %tome-api] %watch perm-pax] caz])
    ::
    ==
  ::  +kv-view: start watching foreign kv (permissions or path)
  ::
  ++  kv-view
    |=  rest=(pole knot)
    ^+  kv
    ?+    rest  ~|(bad-kv-watch-path/rest !!)
        [%perm ~]
      kv
      ::(kv-emit [%pass perm-pax %agent [shi %tome-api] %watch perm-pax])
    ::
        [%data %all ~]
      ?:  (~(has in subs) data-pax)  kv
      =.  subs  (~(put in subs) data-pax)
      (kv-emit [%pass data-pax %agent [shi %tome-api] %watch data-pax])
    ::
    ==
  ::  +kv-perm: check a permission level, return true if allowed
  ::
  ++  kv-perm
    |=  [lvl=?(%read %create %overwrite)]
    ^-  ?
    ?-    lvl
        %read
      ?:  (~(has in read.whi) src.bol)  %.y
      ?:  (~(has in read.bla) src.bol)  %.n
      ?-  read.per
        %unset    %.n
        %no       %.n
        %our      =(our.bol src.bol)
        %open     %.y
        %yes      %.y
          %space
        =/  memb  .^(view:m-s:r-l %gx /(scot %p our.bol)/spaces/(scot %da now.bol)/(scot %p shi)/[spa]/is-member/(scot %p our.bol)/noun)
        ?>  ?=(%is-member -.memb)
        is-member.memb
      ==
    ::
        %create
      ?:  (~(has in write.whi) src.bol)  %.y
      ?:  (~(has in write.bla) src.bol)  %.n
      ?-  write.per
        %unset    %.n
        %no       %.n
        %our      =(our.bol src.bol)
        %open     %.y
        %yes      %.y
          %space
        =/  memb  .^(view:m-s:r-l %gx /(scot %p our.bol)/spaces/(scot %da now.bol)/(scot %p shi)/[spa]/is-member/(scot %p our.bol)/noun)
        ?>  ?=(%is-member -.memb)
        is-member.memb
      ==
    ::
        %overwrite
      ?:  (~(has in admin.whi) src.bol)  %.y
      ?:  (~(has in admin.bla) src.bol)  %.n
      ?-  admin.per
        %unset    %.n
        %no       %.n
        %our      =(our.bol src.bol)
        %open     %.y
        %yes      %.y
          %space
        =/  memb  .^(view:m-s:r-l %gx /(scot %p our.bol)/spaces/(scot %da now.bol)/(scot %p shi)/[spa]/is-member/(scot %p our.bol)/noun)
        ?>  ?=(%is-member -.memb)
        is-member.memb
      ==
    ==
  ::  +kv-team: get read/write/admin permissions for a ship
  ::
  ++  kv-team
    ^-  perm
    =/  read    ?:((kv-perm %read) %yes %no)
    =/  write   ?:((kv-perm %create) %yes %no)
    =/  admin   ?:((kv-perm %overwrite) %yes %no)
    [read write admin]
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
          whi=invited
          bla=invited
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
    :: ~&  >>  data
    =.  feed.tod  (~(put by feed.tod) [buc lo] [per ids whi bla data])
    [(flop caz) state(tome (~(put bi tome) [shi spa] ap tod))]
  ::  +kv-abed: initialize nested core.  only works when the map entries already exist
  ::
  ++  fe-abed
    |=  [p=ship s=space a=app b=bucket l=log]
    =/  tod       (~(got bi tome) [p s] a)
    =/  fee       (~(got by feed.tod) [b l])
    =/  pp        `@tas`(scot %p p) :: planet for path
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
      whi       whitelist.fee
      bla       blacklist.fee
      data      data.fee
      data-pax  /feed/[pp]/[s]/[a]/[b]/[type]/data/all
      perm-pax  /feed/[pp]/[s]/[a]/[b]/[type]/perm
    ==
  ::  +fe-peer: handle incoming watch requests
  ::
  ++  fe-peer
    |=  rest=(pole knot)
    ^+  fe
    fe
    :: ?+    rest  ~|(bad-feed-watch-path/rest !!)
    ::     [%perm ~]
    ::   %-  fe-emit
    ::   [%give %fact ~ %feed-update !>(`feed-update`[%perm fe-team])]
    ::     :: [%give %kick ~[perm-pax] `src.bol]
    :: ::
    ::     [%data %all ~]
    ::   %-  kv-emit
    ::   [%give %fact ~ %feed-update !>(`feed-update`[%all data])]
    :: ::
    ::     [%data %key k=@t ~]  :: TODO these should eventually be scries.
    ::   %-  kv-emil  :~
    ::     [%give %fact ~ %feed-update !>(`feed-update`[%get (~(gut by data) k.rest ~)])]
    ::     :: [%give %kick ~[data-pax] `src.bol]
    ::   ==
    :: ::
    :: ==
  ::  +fe-poke: handle log/feed pokes
  ::
  ++  fe-poke
    |=  act=feed-action
    ^+  fe
    =/  fon  ((on time feed-value) gth)  :: mop needs this to work
    ?+    -.act  ~|('bad-feed-action' !!)
        %new-post
      ?>  ?:(=(src.bol our.bol) %.y (fe-perm %create))  :: TODO maybe do error prints here instead (and similar)
      ::
      %=  fe
        ids   (~(put by ids) id.act now.bol)
        data  (put:fon data now.bol [id.act src.bol src.bol now.bol now.bol s+content.act *links])
      ==
    ::
        %delete-post
      =+  time=(~(gut by ids) id.act ~)
      ?~  time  :: if no post, do nothing
        fe
      =*  curr  (got:fon data time)
      =*  lvl   ?:(=(src.bol created-by.curr) ?:(=(lo %.y) %overwrite %create) %overwrite)
      ?>  ?:(=(src.bol our.bol) %.y (fe-perm lvl))
      ::
      =/  res  (del:fon data time)
      %=  fe
        ids   (~(del by ids) id.act)
        data  +.res  :: mop delete return type is weird. tail is the new map
      ==
    ::
        %edit-post
      =+  time=(~(gut by ids) id.act ~)
      ?~  time  :: if no post, do nothing
        fe
      =/  curr  (got:fon data time)
      =*  lvl   ?:(=(src.bol created-by.curr) ?:(=(lo %.y) %overwrite %create) %overwrite)
      ?>  ?:(=(src.bol our.bol) %.y (fe-perm lvl))
      ::
      %=  fe
        data  (put:fon data time [id.act created-by.curr src.bol created-at.curr now.bol s+content.act *links])
      ==
    ::
        %clear-feed
      ?~  ids  fe  :: if no posts, do nothing
      ::
      ?>  ?:(=(src.bol our.bol) %.y (fe-perm %overwrite))
      %=  fe
        ids  *feed-ids
        data  *feed-data
      ==
    ::
        %verify-feed
      :: The bucket must exist to get this far, so we just need to verify read permissions.
      ?>  ?:(=(src.bol our.bol) %.y (fe-perm %read))
      fe
    ::
        %set-post-link  :: links are currently only supported by feeds, not logs
      ?>  =(lo %.n)
      =+  time=(~(gut by ids) id.act ~)
      ?~  time  :: if no post, do nothing.  TODO: should these all be crashes? Probably depends
        fe
      ?>  ?:(=(src.bol our.bol) %.y (fe-perm %create))
      ::
      =/  curr  (got:fon data time)
      =/  new-links  (~(put by links.curr) src.bol s+value.act)
      %=  fe
        data  (put:fon data time [id.act created-by.curr updated-by.curr created-at.curr updated-at.curr content.curr new-links])
      ==
    ::
        %remove-post-link
      ?>  =(lo %.n)
      =+  time=(~(gut by ids) id.act ~)
      ?~  time  :: if no post, do nothing.
        fe
      ?>  ?:(=(src.bol our.bol) %.y (fe-perm %create))
      ::
      =/  curr  (got:fon data time)
      =/  new-links  (~(del by links.curr) src.bol)
      %=  fe
        data  (put:fon data time [id.act created-by.curr updated-by.curr created-at.curr updated-at.curr content.curr new-links])
      ==
    ::
    ==
  ::  fe-view: start watching foreign feed
  ::
  ++  fe-view
    |=  rest=(pole knot)
    ^+  fe
    ?+    rest  ~|(bad-feed-watch-path/rest !!)
        [%perm ~]
      fe
      ::(kv-emit [%pass perm-pax %agent [shi %tome-api] %watch perm-pax])
    ::
        [%data %all ~]
      ?:  (~(has in subs) data-pax)  fe
      =.  subs  (~(put in subs) data-pax)
      (fe-emit [%pass data-pax %agent [shi %tome-api] %watch data-pax])
    ::
    ==
  ::  +k
  ::  +fe-perm: check a permission level, return true if allowed
  ::  duplicates +kv-perm
  ++  fe-perm
    |=  [lvl=?(%read %create %overwrite)]
    ^-  ?
    ?-    lvl
        %read
      ?:  (~(has in read.whi) src.bol)  %.y
      ?:  (~(has in read.bla) src.bol)  %.n
      ?-  read.per
        %unset    %.n
        %no       %.n
        %our      =(our.bol src.bol)
        %open     %.y
        %yes      %.y
          %space
        =/  memb  .^(view:m-s:r-l %gx /(scot %p our.bol)/spaces/(scot %da now.bol)/(scot %p shi)/[spa]/is-member/(scot %p our.bol)/noun)
        ?>  ?=(%is-member -.memb)
        is-member.memb
      ==
    ::
        %create
      ?:  (~(has in write.whi) src.bol)  %.y
      ?:  (~(has in write.bla) src.bol)  %.n
      ?-  write.per
        %unset    %.n
        %no       %.n
        %our      =(our.bol src.bol)
        %open     %.y
        %yes      %.y
          %space
        =/  memb  .^(view:m-s:r-l %gx /(scot %p our.bol)/spaces/(scot %da now.bol)/(scot %p shi)/[spa]/is-member/(scot %p our.bol)/noun)
        ?>  ?=(%is-member -.memb)
        is-member.memb
      ==
    ::
        %overwrite
      ?:  (~(has in admin.whi) src.bol)  %.y
      ?:  (~(has in admin.bla) src.bol)  %.n
      ?-  admin.per
        %unset    %.n
        %no       %.n
        %our      =(our.bol src.bol)
        %open     %.y
        %yes      %.y
          %space
        =/  memb  .^(view:m-s:r-l %gx /(scot %p our.bol)/spaces/(scot %da now.bol)/(scot %p shi)/[spa]/is-member/(scot %p our.bol)/noun)
        ?>  ?=(%is-member -.memb)
        is-member.memb
      ==
    ==
  ::  +fe-team: get read/write/admin permissions for a ship
  ::
  ++  fe-team
    ^-  perm
    =/  read    ?:((fe-perm %read) %yes %no)
    =/  write   ?:((fe-perm %create) %yes %no)
    =/  admin   ?:((fe-perm %overwrite) %yes %no)
    [read write admin]
  ::
  --
--