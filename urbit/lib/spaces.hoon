/-  store=spaces-store, member-store=membership, visas
/+  memb-lib=membership
=<  [store .]
=,  store
|%

++  create-space
  |=  [=ship slug=@t payload=add-payload:store updated-at=@da]
  ^-  space:store
  =/  default-theme
    [
      mode=%light
      background-color='#C4C3BF'
      accent-color='#4E9EFD'
      input-color='#fff'
      dock-color='#fff'
      icon-color='rgba(95,94,88,0.3)'
      text-color='#333333'
      window-color='#fff'
      wallpaper='https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2832&q=100'
    ]
  =/  new-space
    [
      path=[ship slug]
      name=name:payload
      description=description:payload
      type=type:payload
      access=access:payload
      picture=picture:payload
      color=color:payload
      archetype=archetype:payload
      theme=default-theme
      updated-at=updated-at
    ]
  new-space
::
::  json
::
++  enjs
  =,  enjs:format
  |%
  ++  reaction
    |=  rct=^reaction
    ^-  json
    %-  pairs
    :_  ~
    ^-  [cord json]
    ?-  -.rct
        %initial
      :-  %initial
      %-  pairs
      :~  [%spaces (spaces-map:encode spaces.rct)]
          [%membership (membership-map:encode membership.rct)]
          [%invitations (invitations:encode invitations.rct)]
      ==
    ::
        %add
      :-  %add
      %-  pairs
      :~  [%space (spc:encode space.rct)]
          [%members (membs:encode members.rct)]
      ==
    ::
        %replace
      :-  %replace
      %-  pairs
      :~  [%space (spc:encode space.rct)]
      ==
    ::
        %remove
      :-  %remove
      %-  pairs
      :~  [%space-path s+(spat /(scot %p ship.path.rct)/(scot %tas space.path.rct))]
      ==
    ::
        %remote-space
      :-  %remote-space
      %-  pairs
      :~  [%path s+(spat /(scot %p ship.path.rct)/(scot %tas space.path.rct))]
          [%space (spc:encode space.rct)]
          :: [%members (passes:encode:membership membership.rct)]
          [%members (membs:encode members.rct)]
      ==

    
      ::   %members
      :: :-  %members
      :: %-  pairs
      :: :~  [%path s+(spat /(scot %p ship.path.rct)/(scot %tas space.path.rct))]
      ::     [%members (membership-json:encode:memb-lib membership.rct)]
      :: ==
    ==
  ::
  ++  view :: encodes for on-peek
    |=  vi=^view
    ^-  json
    %-  pairs
    :_  ~
    ^-  [cord json]
    :-  -.vi
    ?-  -.vi
      ::
        %space
      (spc:encode space.vi)
      ::
        %spaces
      (spaces-map:encode spaces.vi)
    ==
  --

::
++  dejs
  =,  dejs:format
  |%
  ++  action
    |=  jon=json
    ^-  ^action
    =<  (decode jon)
    |%
    ++  decode
      %-  of
      :~  [%add add-space]
          [%update update-space]
          [%remove path-key]
          [%join path-key]
          [%leave path-key]
          :: [%kicked kicked]
      ==
    ::
    ++  de-space
      %-  ot
      :~  [%path pth]
          [%name so]
          [%type space-type]
          [%access access]
          [%picture so]
          [%color so]
          [%archetype archetype]
          [%theme thm]
          [%updated-at di]
      ==
    ::
    ++  add-space
      %-  ot
      :~  [%slug so]
          [%payload add-payload]
          [%members (op ;~(pfix sig fed:ag) memb)]
      ==
    ::
    ++  update-space
      %-  ot
      :~  [%path pth]
          [%payload edit-payload]
      ==
    ::
    ++  kicked
      %-  ot
      :~  [%path pth]
          [%ship (su ;~(pfix sig fed:ag))]
      ==
    ::
    ++  path-key
      %-  ot
      :~  [%path pth]
      ==
    ::
    ++  pth
      %-  ot
      :~  [%ship (su ;~(pfix sig fed:ag))]
          [%space so]
      ==
    ::
    ++  add-payload
      %-  ot
      :~  [%name so]
          [%description so]
          [%type space-type]
          [%access access]
          [%picture so]
          [%color so]
          [%archetype archetype]
      ==
    ::
    ++  edit-payload
      %-  ot
      :~  [%name so]
          [%description so]
          [%access (su (perk %public %private ~))]
          [%picture so]
          [%color so]
          [%theme thm]
      ==
    ::
    ++  thm
      %-  ot
      :~  [%mode theme-mode]
          [%background-color so]
          [%accent-color so]
          [%input-color so]
          [%dock-color so]
          [%icon-color so]
          [%text-color so]
          [%window-color so]
          [%wallpaper so]
      ==
    ::
    ++  memb
      %-  ot
      :~  [%roles (as rol)]
          [%alias so]
          [%status status]
          :: [%pinned bo]
      ==
    ::
    ++  theme-mode
      |=  =json
      ^-  theme-mode:store
      ?>  ?=(%s -.json)
      ?:  =('light' p.json)    %light
      ?:  =('dark' p.json)     %dark
      !!
    ::
    ++  space-type
      |=  =json
      ^-  space-type:store
      ?>  ?=(%s -.json)
      ?:  =('group' p.json)   %group
      ?:  =('our' p.json)     %our
      ?:  =('space' p.json)   %space
      !!
    ::
    ++  rol
      |=  =json
      ^-  role:member-store
      ?>  ?=(%s -.json)
      ?:  =('initiate' p.json)   %initiate
      ?:  =('member' p.json)     %member
      ?:  =('admin' p.json)      %admin
      ?:  =('owner' p.json)      %owner
      !!
    ::
    ++  archetype
      |=  =json
      ^-  archetype:store
      ?>  ?=(%s -.json)
      ?:  =('home' p.json)                %home
      ?:  =('community' p.json)           %community
      ?:  =('creator-dao' p.json)         %creator-dao
      ?:  =('service-dao' p.json)         %service-dao
      ?:  =('investment-dao' p.json)      %investment-dao
      !!
    ::
    ++  access
      |=  =json
      ^-  space-access:store
      ?>  ?=(%s -.json)
      ?:  =('public' p.json)              %public
      ?:  =('antechamber' p.json)         %antechamber
      ?:  =('private' p.json)             %private
      !!
    ::
    ++  status
      |=  =json
      ^-  status:member-store
      ?>  ?=(%s -.json)
      ?:  =('invited' p.json)     %invited
      ?:  =('joined' p.json)      %joined
      ?:  =('host' p.json)        %host
      !!
    --
  --
::
::
::
++  encode
  =,  enjs:format
  |%
  ++  spaces-map
    |=  =spaces:store
    ^-  json
    %-  pairs
    %+  turn  ~(tap by spaces)
    |=  [pth=space-path:store space=space:store]
    =/  spc-path  (spat /(scot %p ship.pth)/(scot %tas space.pth))
    ^-  [cord json]
    [spc-path (spc space)]
  ::
  ++  membership-map
    |=  =membership:member-store
    ^-  json
    %-  pairs
    %+  turn  ~(tap by membership)
    |=  [pth=space-path:store members=members:member-store]
    =/  spc-path  (spat /(scot %p ship.pth)/(scot %tas space.pth))
    ^-  [cord json]
    [spc-path (membs members)]
  ::
  ++  membs
    |=  =members:member-store
    ^-  json
    %-  pairs
    %+  turn  ~(tap by members)
    |=  [=^ship =member:member-store]
    ^-  [cord json]
    [(scot %p ship) (memb member)]
  ::
  ++  memb
    |=  =member:member-store
    ^-  json
    %-  pairs
    :~  ['roles' a+(turn ~(tap in roles.member) |=(rol=role:member-store s+(scot %tas rol)))]
        ['status' s+(scot %tas status.member)]
        :: ['pinned' b+pinned.member]
    ==
  ::
  ++  spc
    |=  =space
    ^-  json
    %-  pairs
    :~  ['path' s+(spat /(scot %p ship.path.space)/(scot %tas space.path.space))]
        ['name' s+name.space]
        ['description' s+description.space]
        ['access' s+access.space]
        ['type' s+type.space]
        ['picture' s+picture.space]
        ['color' s+color.space]
        ['theme' (thm theme.space)]
        ['updatedAt' (time updated-at.space)]
    ==
  ::
  ++  thm
    |=  =theme
    ^-  json
    %-  pairs
    :~
      ['mode' s+(scot %tas mode.theme)]
      ['backgroundColor' s+background-color.theme]
      ['accentColor' s+accent-color.theme]
      ['inputColor' s+input-color.theme]
      ['dockColor' s+dock-color.theme]
      ['iconColor' s+icon-color.theme]
      ['textColor' s+text-color.theme]
      ['windowColor' s+window-color.theme]
      ['wallpaper' s+wallpaper.theme]
    ==
  ::
  ++  invitations
    |=  =invitations:visas
    ^-  json
    %-  pairs
    %+  turn  ~(tap by invitations)
    |=  [pth=space-path:store inv=invite:visas]
    =/  spc-path  (spat /(scot %p ship.pth)/(scot %tas space.pth))
    ^-  [cord json]
    [spc-path (invite inv)]
  ::
  ++  invite
    |=  =invite:visas
    ^-  json
    %-  pairs:enjs:format
    :~  ['inviter' s+(scot %p inviter.invite)]
        ['path' s+(spat /(scot %p ship.path.invite)/(scot %tas space.path.invite))]
        ['role' s+(scot %tas role.invite)]
        ['message' s+message.invite]
        ['name' s+name.invite]
        ['type' s+type.invite]
        ['picture' s+picture.invite]
        ['color' s+color.invite]
        ['invitedAt' (time invited-at.invite)]
    ==
  ::
  --
--
