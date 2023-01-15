::  a space agent skeleton
/-  *tome
/+  r-l=realm-lib
/+  verb, dbug, defa=default-agent
/+  *mip
::
|%
::
+$  versioned-state  $%(state-0)
::
+$  state-0  [%0 tome=(mip space app tome-data)]
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
    |=  [wir=wire sig=sign:agent:gall]
    ~>  %bout.[0 '%tome-api +on-agent']
    ^-  (quip card _this)
    `this
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
      [%kv space=@ app=@ bucket=@ rest=*]
    =^  cards  state
      kv-abet:(kv-peer:(kv-abed:kv [space.pol app.pol bucket.pol]) rest.pol)
    (emil cards)
  ==
++  poke
  |=  [mar=mark vaz=vase]
  =^  cards  state
    ?+  mar  ~|(bad-tome-mark/mar !!)
        %tome-action
      =/  act  !<(tome-action vaz)
      ?-  -.act
          %init-tome
        ?.  =(our.bol src.bol)  ~|('no-foreign-init-tome' !!)
        ?:  (~(has bi tome) space.act app.act)
          `state
        `state(tome (~(put bi tome) space.act app.act *tome-data))
          %init-kv
        :: todo should I do this in the nested core?
        ?.  =(our.bol src.bol)  ~|('no-foreign-init-kv' !!)
        =+  td=(~(got bi tome) space.act app.act)
        ?:  (~(has by store.td) bucket.act)
          `state
        =.  store.td  (~(put by store.td) bucket.act [perm.act ~ ~ *kv-meta *kv-data])
        `state(tome (~(put bi tome) space.act app.act td))
      ==
        %kv-action
      =/  act  !<(kv-action vaz)
      =*  do  kv-abet:(kv-poke:(kv-abed:kv [space.act app.act bucket.act]) act)
      ?-  -.act
          %set-value
        do
          %remove-value
        do
          %clear-kv
        do
      ==
    ==
  (emil cards)
::
::  +kv: keyvalue engine
::
++  kv
  |_  $:  s=space
          a=app
          b=bucket
          td=tome-data
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
    =.  store.td  (~(put by store.td) b [per whi bla meta data])
    [(flop caz) state(tome (~(put bi tome) s a td))]
  ::
  ++  kv-abed
    |=  [s=space a=app b=bucket]
    =+  td=(~(got bi tome) s a)
    =+  st=(~(got by store.td) b)
    %=  kv
      s     s
      a     a
      b     b
      td    td
      per   perm.st
      whi   whitelist.st
      bla   blacklist.st
      meta  meta.st
      data  data.st
    ==
  ++  kv-peer
    |=  [rest=(pole knot)]
    ^+  kv
    ?+    rest  ~|(bad-kv-watch-path/rest !!)
      ::   [%perm ~]
      :: %-  kv-emit
      :: [%give %fact ~ %perm-update ...]
        [%data %all ~]
      %-  kv-emit
      [%give %fact ~ %json !>(o+data)]
        [%data %key k=@t ~]
      %-  kv-emit
      [%give %fact ~ %json !>((~(gut by data) k.rest ~))]
    ==
  ++  kv-poke
    |=  a=kv-action
    ^+  kv
    ?-  -.a
        %set-value
      =+  cm=(~(gut by meta) key.a ~)
      ?~  cm
        ::  this value is new, so create new metadata entry alongside it
        =+  nm=[src.bol src.bol now.bol now.bol]
        kv(meta (~(put by meta) key.a nm), data (~(put by data) key.a [%s value.a]))
      ::  this value already exists, so update its metadata
      =+  nm=[created-by.cm src.bol created-at.cm now.bol]
      kv(meta (~(put by meta) key.a nm), data (~(put by data) key.a [%s value.a]))
        %remove-value
      =+  cm=(~(gut by meta) key.a ~)
      ?~  cm
        kv
      kv(meta (~(del by meta) key.a), data (~(del by data) key.a))
        %clear-kv
      kv(meta *kv-meta, data *kv-data)
    ==
  --
--