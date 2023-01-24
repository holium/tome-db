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
        [%kv ship=@ space=@ app=@ bucket=@ %data %all ~]
      ::  local store should already have 
      =/  ship  `@p`(slav %p ship.pol)
      ?+    -.sig  `state
        %kick  kv-abet:kv-view:(kv-abed:kv [ship space.pol app.pol bucket.pol])
        %fact  kv-abet:(kv-dude:(kv-abed:kv [ship space.pol app.pol bucket.pol]) cage.sig)
      ::
          %watch-ack
        %.  `state
        ?~(p.sig same (slog leaf/"%tome-kv nack" ~))
      ==
    ==
  (emil cards)
::  +poke: handle on-poke
::
++  poke
  |=  [mar=mark vaz=vase]
  =^  cards  state
    ?+  mar  ~|(bad-tome-mark/mar !!)
        %tome-action
      =/  act  !<(tome-action vaz)
      =/  ship  `@p`(slav %p `@t`(cat 3 '~' ship.act))
      ?-  -.act
          %init-tome
        ?.  =(our.bol src.bol)  ~|('no-foreign-init-tome' !!)
        ?:  (~(has bi tome) [ship space.act] app.act)
          `state
        `state(tome (~(put bi tome) [ship space.act] app.act *tome-data))
      ::
          %init-kv
      ::  %init-kv expects a %init-tome to have already been processed.
        ?.  =(our.bol src.bol)  ~|('no-foreign-init-kv' !!)
        =+  tod=(~(got bi tome) [ship space.act] app.act)
        ?:  (~(has by store.tod) bucket.act)
          `state
        =.  store.tod  (~(put by store.tod) bucket.act [perm.act *invited *invited *kv-meta *kv-data])
        `state(tome (~(put bi tome) [ship space.act] app.act tod))
      ::
      ::  TODO consider making this a kv-action
          %watch-kv
        ?:  =(our.bol ship)  ~|('no-watch-local-kv' !!)
        kv-abet:kv-view:(kv-abed:kv [ship space.act app.act bucket.act])
      ::
      ==
        %kv-action
      =/  act     !<(kv-action vaz)
      =/  ship    `@p`(slav %p `@t`(cat 3 '~' ship.act))
      =*  do      kv-abet:(kv-poke:(kv-abed:kv [ship space.act app.act bucket.act]) act)
      ?-  -.act
          %set-value
        do
          %remove-value
        do
          %clear-kv
        do
          %verify-kv
        do
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
    =+  tod=(~(got bi tome) [p s] a)
    =+  sto=(~(got by store.tod) b)
    %=  kv
      shi   p
      spa   s
      app   a
      buc   b
      tod   tod
      per   perm.sto
      whi   whitelist.sto
      bla   blacklist.sto
      meta  meta.sto
      data  data.sto
    ==
  ::  +kv-view: start watching foreign kv
  ::
  ++  kv-view
    ^+  kv
    =/  pp    `@tas`(scot %p shi) :: planet for path
    =/  pax   /kv/[pp]/[spa]/[app]/[buc]/data/all
    ::
    ?:  (~(has in subs) pax)  kv
    =.  subs  (~(put in subs) pax)  :: does this even work?
    (kv-emit [%pass pax %agent [shi %tome-api] %watch pax])
  ::  +kv-dude: handle foreign kv update
  ::
  ++  kv-dude
    |=  cag=cage
    ^+  kv
    ?<  =(our.bol shi)
    ?+  p.cag  ~|('bad-kv-dude' !!)
        %kv-update
      =/  upd     !<(kv-update q.cag)
      =/  pp      `@tas`(scot %p shi) :: planet for path
      =/  pax     ~[/kv/[pp]/[spa]/[app]/[buc]/data/all]
      ?+  -.upd   ~|('bad-kv-update' !!)
          %set
        %=  kv
          data  (~(put by data) key.upd s+value.upd)
          caz   [[%give %fact pax %kv-update !>(upd)] caz]
        ==
          %remove
        %=  kv
          data  (~(del by data) key.upd)
          caz   [[%give %fact pax %kv-update !>(upd)] caz]
        ==
          %clear
        %=  kv
          data  *kv-data
          caz   [[%give %fact pax %kv-update !>(upd)] caz]
        ==
          %all
        %=  kv
          data  data.upd
          caz   [[%give %fact pax %kv-update !>(upd)] caz]
        ==
      ==
    ==
  ::  +kv-perm: check permissions, return true if allowed
  ::
  ++  kv-perm
    |=  [act=?(%read %create %overwrite)]
    ^-  ?
    ?-  act
        %read
      ?:  (~(has in read.whi) src.bol)  %.y
      ?:  (~(has in read.bla) src.bol)  %.n
      ?-  read.per
          %unset
        %.n
          %our
        =(our.bol src.bol)
          %space
        :: TODO check if in the space
        %.y
          %open
        %.y
      ==
        %create
      ?:  (~(has in write.whi) src.bol)  %.y
      ?:  (~(has in write.bla) src.bol)  %.n
      ?-  write.per
          %unset
        %.n
          %our
        =(our.bol src.bol)
          %space
        :: TODO check if in the space
        %.y
          %open
        %.y
      ==
        %overwrite
      ?:  (~(has in admin.whi) src.bol)  %.y
      ?:  (~(has in admin.bla) src.bol)  %.n
      ?-  admin.per
          %unset
        %.n
          %our
        =(our.bol src.bol)
          %space
        :: TODO check if in the space
        %.y
          %open
        %.y
      ==
    ==
  ::
  ++  kv-peer
    |=  rest=(pole knot)
    ^+  kv
    ?+    rest  ~|(bad-kv-watch-path/rest !!)
      ::   [%perm ~]
      ::   ~[[key.act s+value.act]]
      :: %-  kv-emit
      :: [%give %fact ~ %perm-update ...]
        [%data %all ~]
      %-  kv-emit
      [%give %fact ~ %kv-update !>(`kv-update`[%all data])]
        [%data %key k=@t ~]
      %-  kv-emit
      [%give %fact ~ %kv-update !>(`kv-update`[%get (~(gut by data) k.rest ~)])]
    ==
  ::
  ::  cm = current metadata
  ::  nm = new metadata
  ::
  ++  kv-poke
    |=  act=kv-action
    ^+  kv
    ::  right now live updates only go to the subscribeAll endpoint
    =/  pp   `@tas`(scot %p shi) :: planet for path
    =/  pax  ~[/kv/[pp]/[spa]/[app]/[buc]/data/all]
    ?-  -.act
        %set-value
      ::  equivalent value is already set, do nothing.
      ?:  =(s+value.act (~(gut by data) key.act ~))  kv
      =+  cm=(~(gut by meta) key.act ~)
      =/  lvl
        ?~  cm
          %create
        ?:(=(src.bol created-by.cm) %create %overwrite)
      ?>  (kv-perm lvl)
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
        caz   [[%give %fact pax %kv-update !>(`kv-update`[%set key.act value.act])] caz]
      ==
      ::
        %remove-value
      =+  cm=(~(gut by meta) key.act ~)
      ?~  cm
        kv
      =/  lvl  ?:(=(src.bol created-by.cm) %create %overwrite)
      ?>  (kv-perm lvl)
      ::
      %=  kv
        meta  (~(del by meta) key.act)
        data  (~(del by data) key.act)
        caz   [[%give %fact pax %kv-update !>(`kv-update`[%remove key.act])] caz]
      ==
      ::
        %clear-kv
      ?~  meta  kv  :: nothing to clear
      ::  could check if all values are ours for %create perm level, but that's overkill
      ?>  (kv-perm %overwrite)
      %=  kv
        meta  *kv-meta
        data  *kv-data
        caz   [[%give %fact pax %kv-update !>(`kv-update`[%clear ~])] caz]
      ==
        %verify-kv
      :: The bucket must exist to get this far, so we just need to verify read permissions.
      ?>  (kv-perm %read)
      kv
    ==
  --
--